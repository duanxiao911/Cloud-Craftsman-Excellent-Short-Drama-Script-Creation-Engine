"""
云匠引擎 API 服务 - 流式版

提供SSE流式接口，前端每一步调用一个专家时，后端流式返回LLM输出。
同时保留原有异步工作流接口。

Endpoints:
    POST /api/v1/stream        - 【核心】流式LLM代理（前端每步调用）
    POST /api/v1/expert/run    - 专家感知流式（自动加载知识库）
    POST /api/v1/create        - 完整流程（异步）
    POST /api/v1/step/{expert} - 单步执行（同步）
    GET  /api/v1/progress/{id} - 查询进度
    GET  /api/v1/experts       - 列出专家
    GET  /health               - 健康检查
    POST /chat/completions     - OpenAI兼容代理（前端直接调用）
"""

import os
import json
import asyncio
import httpx
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from datetime import datetime

# 四节点交互模式
from session_manager import SessionManager
from session_routes import register_session_routes


# ============ Pydantic模型 ============

class StreamRequest(BaseModel):
    """流式LLM代理请求"""
    messages: List[Dict[str, str]] = Field(..., description="OpenAI格式消息列表")
    model: Optional[str] = Field(None, description="模型名称，不传用默认")
    temperature: Optional[float] = Field(0.8, description="温度")
    max_tokens: Optional[int] = Field(4096, description="最大token")


class ExpertRunRequest(BaseModel):
    """专家感知流式请求"""
    expert_id: str = Field(..., description="专家ID，如 soul_catcher, project_configurator")
    user_input: str = Field(..., description="用户输入/创意描述")
    context: Optional[Dict[str, Any]] = Field(None, description="前序节点产出上下文")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="对话历史（用于追问类专家）")
    model: Optional[str] = Field(None, description="模型名称")
    temperature: Optional[float] = Field(0.8)


class CreateRequest(BaseModel):
    """完整创作请求"""
    story_direction: str = Field(..., description="故事方向描述")
    drama_type: Optional[str] = Field(None, description="故事类型")
    total_episodes: Optional[int] = Field(None, description="总集数")
    user_materials: Optional[str] = Field(None, description="用户素材")
    stop_at: Optional[str] = Field(None, description="在指定专家处停止")


class StepRequest(BaseModel):
    """单步执行请求"""
    user_input: str = Field(..., description="输入内容")
    context: Optional[Dict] = Field(None, description="上下文")


# ============ 专家知识库 ============

# 17专家ID到prompt文件的映射
EXPERT_PROMPT_MAP = {
    "soul_catcher": "§0 灵魂捕手 - 对话式追问确认故事方向",
    "project_configurator": "§1 项目策划师 - 项目定位与参数规划",
    "story_director": "§2 故事总监 - 六大审核红线+叙事因果铁律",
    "structure_architect": "§3 剧情架构师 - 节拍表+三幕五层结构",
    "business_strategist": "§4 商业分析师 - 市场定位+受众画像",
    "character_forger": "§5 人物锻造师 - 角色小传+弧光设计",
    "episode_writer": "§6 集纲编剧 - 分集大纲+节奏控制",
    "quality_director": "§7 质量总监 - 全集质量审计",
    "episode_outline_reviewer": "§8 大纲审校员 - 大纲一致性校验",
    "mission_commander": "§9 创意捕手 - 创意灵感提炼",
    "dialogue_master": "§10 台词打磨师 - 对白精修+角色语感",
    "scene_craftsman": "§11 场景美术师 - 场景视觉+氛围描写",
    "visual_director": "§12 分镜导演 - 镜头语言+画面节奏",
    "format_craftsman": "§13 排版工匠 - 剧本格式规范",
    "revision_editor": "§14 修订编辑师 - 全稿润色修订",
    "compliance_guard": "§15 合规审核官 - 内容合规检查",
    "script_reviewer": "§16 终审评审官 - 终稿综合评审",
}


# ============ FastAPI应用 ============

# 全局工作流状态
workflows: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    app.state.http_client = httpx.AsyncClient(timeout=120.0)
    yield
    await app.state.http_client.aclose()


def create_app() -> FastAPI:
    """创建FastAPI应用"""
    app = FastAPI(
        title="云匠引擎 API",
        description="精品短剧剧本创作引擎 - 流式API服务",
        version="2.0.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ============ 托管前端页面 ============
    from fastapi.responses import FileResponse, HTMLResponse
    import pathlib

    @app.get("/", response_class=HTMLResponse)
    async def serve_frontend():
        """直接提供前端HTML页面"""
        html_path = pathlib.Path(__file__).parent / "demo-v7.html"
        if html_path.exists():
            return FileResponse(html_path, media_type="text/html")
        return HTMLResponse("<h1>demo-v7.html 未找到，请将其放到 server.py 同目录下</h1>", status_code=404)

    # 初始化httpx客户端已在lifespan中完成

    # ============ 四节点交互模式 Session管理 ============
    session_manager = SessionManager(sessions_dir="sessions")
    register_session_routes(app, session_manager)

    # ============ 辅助函数 ============

    def get_llm_config() -> Dict[str, str]:
        """获取LLM配置（从环境变量）"""
        return {
            "api_key": os.getenv("OPENAI_API_KEY", os.getenv("LLM_API_KEY", "")),
            "base_url": os.getenv("OPENAI_BASE_URL", os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")),
            "model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
        }

    async def stream_llm(messages: List[Dict], model: str = None, temperature: float = 0.8, max_tokens: int = 4096):
        """
        调用LLM API并以SSE格式流式返回
        
        发送的事件格式：
        data: {"type": "chunk", "content": "..."}     -- 文本块
        data: {"type": "done", "total_tokens": N}     -- 完成
        data: {"type": "error", "message": "..."}     -- 错误
        """
        config = get_llm_config()
        api_key = config["api_key"]
        base_url = config["base_url"].rstrip("/")
        use_model = model or config["model"]

        if not api_key:
            yield f'data: {json.dumps({"type": "error", "message": "未配置API Key，请在环境变量中设置OPENAI_API_KEY"})}\n\n'
            return

        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        try:
            async with app.state.http_client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    yield f'data: {json.dumps({"type": "error", "message": f"LLM API返回{response.status_code}: {error_body.decode()[:300]}"})}\n\n'
                    return

                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]  # 去掉 "data: "
                    if data_str.strip() == "[DONE]":
                        yield f'data: {json.dumps({"type": "done", "total_tokens": -1})}\n\n'
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield f'data: {json.dumps({"type": "chunk", "content": content}, ensure_ascii=False)}\n\n'
                    except json.JSONDecodeError:
                        continue

        except httpx.TimeoutException:
            yield f'data: {json.dumps({"type": "error", "message": "LLM API调用超时"})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"type": "error", "message": f"流式调用异常: {str(e)[:200]}"})}\n\n'

    # ============ 核心API路由 ============

    # 根路径路由已在 serve_frontend 中处理，不再重复定义

    @app.get("/health")
    async def health():
        config = get_llm_config()
        return {
            "status": "healthy",
            "llm_configured": bool(config["api_key"]),
            "model": config["model"],
            "base_url": config["base_url"],
        }


    # ============ OpenAI兼容代理端点（前端直接调用） ============

    class ChatCompletionRequest(BaseModel):
        model: str = "deepseek-chat"
        messages: List[Dict[str, Any]] = []
        temperature: float = 0.8
        max_tokens: int = 16384
        stream: bool = False

    @app.post("/chat/completions")
    async def openai_chat_completions(request: ChatCompletionRequest):
        """
        OpenAI兼容代理端点 - 前端可直接调用，无需API Key
        接受标准OpenAI格式请求，代理转发到DeepSeek，返回标准OpenAI SSE格式
        """
        config = get_llm_config()
        api_key = config["api_key"]
        base_url = config["base_url"].rstrip("/")
        use_model = request.model or config["model"]

        if not api_key:
            raise HTTPException(status_code=500, detail="服务端未配置API Key")

        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": use_model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": request.stream,
        }

        if not request.stream:
            # 非流式：直接转发响应
            try:
                async with app.state.http_client.post(url, json=payload, headers=headers) as resp:
                    body = await resp.aread()
                    from fastapi.responses import Response
                    return Response(content=body, status_code=resp.status_code, media_type="application/json")
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"上游API错误: {str(e)[:200]}")
        else:
            # 流式：透传SSE（直接转发DeepSeek的原始OpenAI格式）
            async def passthrough_stream():
                try:
                    async with app.state.http_client.stream("POST", url, json=payload, headers=headers, timeout=120.0) as resp:
                        if resp.status_code != 200:
                            body = await resp.aread()
                            yield f'data: {json.dumps({"error": {"message": f"上游API返回{resp.status_code}: {body.decode()[:200]}"}})}\n\n'
                            return
                        async for line in resp.aiter_lines():
                            if line:
                                yield line + "\n"
                        yield "\n"
                except Exception as e:
                    yield f'data: {json.dumps({"error": {"message": f"流式代理异常: {str(e)[:200]}"}})}\n\n'

            return StreamingResponse(
                passthrough_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

    # ============ 【核心接口】流式LLM代理 ============

    @app.post("/api/v1/stream")
    async def stream_chat(request: StreamRequest):
        """
        流式LLM代理 - 前端每一步调用此接口
        
        前端发送完整的messages数组（含system和user），后端流式返回LLM输出。
        SSE格式：
        - data: {"type": "chunk", "content": "..."}  文本块
        - data: {"type": "done", "total_tokens": N}  完成
        - data: {"type": "error", "message": "..."}  错误
        """
        return StreamingResponse(
            stream_llm(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature or 0.8,
                max_tokens=request.max_tokens or 4096,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # 禁用nginx缓冲
            },
        )

    # ============ 专家感知流式接口 ============

    @app.post("/api/v1/expert/run")
    async def expert_run(request: ExpertRunRequest):
        """
        专家感知流式接口
        
        根据expert_id自动加载专家知识库，构建完整prompt后流式调用LLM。
        支持conversation_history用于追问类专家（如灵魂捕手）。
        """
        expert_id = request.expert_id
        config = get_llm_config()

        # 构建消息列表
        messages = []

        # 系统提示词（简化版，实际应从知识库加载）
        system_prompt = _build_expert_system_prompt(expert_id, request.context)
        messages.append({"role": "system", "content": system_prompt})

        # 对话历史（用于追问类专家）
        if request.conversation_history:
            messages.extend(request.conversation_history)

        # 当前用户输入
        messages.append({"role": "user", "content": request.user_input})

        return StreamingResponse(
            stream_llm(
                messages=messages,
                model=request.model,
                temperature=request.temperature or 0.8,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    def _build_expert_system_prompt(expert_id: str, context: Optional[Dict] = None) -> str:
        """根据专家ID构建系统提示词"""
        base_prompts = {
            "soul_catcher": """你是一位专精精品短剧的资深编剧，代号§0灵魂捕手。
你的核心能力：通过精准追问，将用户模糊的创作想法转化为清晰、可执行的故事方向。
追问维度：核心人物、核心冲突、情感基调、真实来源、目标受众、类型偏好。
每次最多追问2个维度，保持对话轻量。
当收集到足够信息时，输出【故事方向确认】格式。""",

            "project_configurator": """你是§1项目策划师。根据用户的故事方向，输出项目定位、类型、集数、受众画像等参数规划。""",

            "story_director": """你是§2故事总监。负责六大审核红线和叙事因果铁律的校验。
审核红线：无逻辑硬伤/无人物工具化/无悬浮设定/无价值真空/无文化挪用/无合规风险。
叙事因果铁律：每一个转折必须有前因，每一个选择必须有后果。""",

            "structure_architect": """你是§3剧情架构师。负责节拍表设计和三幕五层结构搭建。
输出标准节拍表（开场钩子→递进→中点翻转→危机→高潮→结局）。""",

            "business_strategist": """你是§4商业分析师。分析市场定位、受众画像、商业潜力。""",

            "character_forger": """你是§5人物锻造师。根据故事方向设计角色小传、人物弧光、关系网络。""",

            "episode_writer": """你是§6集纲编剧。根据故事大纲和人物小传，编写分集大纲。
每集包含：集标题、核心事件、情感节拍、钩子/悬念。""",

            "quality_director": """你是§7质量总监。对全集内容进行质量审计，检查一致性和完整性。""",

            "episode_outline_reviewer": """你是§8大纲审校员。校验大纲与故事方向、人物设定的一致性。""",

            "mission_commander": """你是§9创意捕手。从用户输入中提炼核心创意灵感，发现独特的叙事角度。""",

            "dialogue_master": """你是§10台词打磨师。精修对白，确保每个角色有独特的语感和说话方式。""",

            "scene_craftsman": """你是§11场景美术师。设计场景视觉、氛围描写、空间感。""",

            "visual_director": """你是§12分镜导演。设计镜头语言、画面节奏、视觉叙事。""",

            "format_craftsman": """你是§13排版工匠。确保剧本格式规范，包含场景标题、动作描写、对白、括号注释等标准元素。""",

            "revision_editor": """你是§14修订编辑师。对全稿进行润色修订，提升文学性和可读性。""",

            "compliance_guard": """你是§15合规审核官。检查内容是否符合播出规范和法律法规要求。""",

            "script_reviewer": """你是§16终审评审官。对终稿进行综合评审，给出评分和改进建议。""",
        }

        system_prompt = base_prompts.get(expert_id, f"你是短剧创作引擎专家 {expert_id}。")

        # 注入上下文（前序节点产出）
        if context:
            context_str = json.dumps(context, ensure_ascii=False, indent=2)[:3000]
            system_prompt += f"\n\n=== 前序产出上下文 ===\n{context_str}"

        return system_prompt

    # ============ 原有接口（保留兼容） ============

    @app.post("/api/v1/create")
    async def create_story(request: CreateRequest, background_tasks: BackgroundTasks):
        """启动完整创作工作流（异步）"""
        workflow_id = f"wf_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        workflows[workflow_id] = {
            "status": "started",
            "story_direction": request.story_direction,
            "created_at": datetime.now().isoformat(),
        }
        return {
            "workflow_id": workflow_id,
            "status": "started",
            "message": f"工作流已启动，workflow_id: {workflow_id}",
        }

    @app.post("/api/v1/step/{expert_id}")
    async def run_step(expert_id: str, request: StepRequest):
        """执行单个专家步骤（同步）"""
        return {
            "expert_id": expert_id,
            "content": f"[同步模式] 专家{expert_id}处理中...",
            "validation_passed": True,
            "validation_errors": [],
            "structured_data": {},
        }

    @app.get("/api/v1/progress/{workflow_id}")
    async def get_progress(workflow_id: str):
        """查询工作流进度"""
        if workflow_id not in workflows:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
        wf = workflows[workflow_id]
        return {
            "workflow_id": workflow_id,
            "status": wf.get("status", "unknown"),
            "current_step": 0,
            "total_steps": 17,
            "current_expert": None,
            "completed_experts": [],
        }

    @app.get("/api/v1/experts")
    async def list_experts():
        """列出所有可用专家"""
        return [
            {"id": eid, "name": ename, "description": desc, "in_sequence": True}
            for eid, desc in EXPERT_PROMPT_MAP.items()
            for ename in [eid]
        ]

    return app


# 创建应用实例
app = create_app()


import os
def run_server(host: str = "0.0.0.0", port: int = None, reload: bool = False):
    if port is None:
        port = int(os.getenv("PORT", "8000"))
    """运行API服务器"""
    import uvicorn
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=reload,
    )


if __name__ == "__main__":
    run_server()
