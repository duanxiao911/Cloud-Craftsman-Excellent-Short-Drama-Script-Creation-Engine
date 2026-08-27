"""
FastAPI入口

提供RESTful API和WebSocket支持

Endpoints:
    POST /api/v1/create        - 完整流程
    POST /api/v1/step/{expert} - 单步执行
    GET  /api/v1/progress/{wf_id} - 获取进度
    GET  /api/v1/experts       - 列出专家
    POST /api/v1/resume/{wf_id}  - 恢复断点
    WS   /api/v1/ws/{wf_id}    - WebSocket实时对话
"""

import os
import json
import asyncio
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from datetime import datetime

# 导入项目模块
from src.config.settings import load_config, get_config, ConfigManager
from src.workflow.orchestrator import Orchestrator, WorkflowStatus
from src.experts.base import OpenAIClient
from src.style_packs import STYLE_PACKS
from src.production_export import ProductionExportService
from src.story_state import StoryState
from src.skill_registry import SKILLS, skill_for
from src.database import Database, ProjectDAO, UserDAO, get_db
from src.adaptation_schema import demo_project as adaptation_demo_project, manga_demo_project as adaptation_manga_demo_project, schema_manifest as adaptation_schema_manifest


# ============ Pydantic模型 ============

class CreateRequest(BaseModel):
    """完整创作请求"""
    story_direction: Optional[str] = Field(None, description="故事方向描述")
    idea: Optional[str] = Field(None, description="故事创意（story_direction的别名）")
    drama_type: Optional[str] = Field(None, description="故事类型")
    total_episodes: Optional[int] = Field(None, description="总集数")
    user_materials: Optional[str] = Field(None, description="用户素材（硬约束）")
    user_id: Optional[str] = Field(None, description="用户ID")
    stop_at: Optional[str] = Field(None, description="可选，在指定专家处停止")
    style_pack_id: str = Field("cinematic", description="版本化风格经验包ID")
    style_pack_version: Optional[str] = Field(None, description="指定风格包版本；空值使用最新版")
    project_id: Optional[str] = Field(None, description="关联的项目ID")

    @property
    def effective_story_direction(self) -> str:
        """优先使用story_direction，回退到idea"""
        return self.story_direction or self.idea or ""

    @model_validator(mode="after")
    def validate_direction(self):
        if not self.story_direction and not self.idea:
            raise ValueError("story_direction 或 idea 至少需要提供一个")
        return self


class StepRequest(BaseModel):
    """单步执行请求"""
    user_input: str = Field(..., description="输入内容")
    context: Optional[Dict] = Field(None, description="可选，外部传入的上下文")


class StepResponse(BaseModel):
    """单步执行响应"""
    expert_id: str
    content: str
    validation_passed: bool
    validation_errors: List[str]
    structured_data: Dict


class ProgressResponse(BaseModel):
    """进度查询响应"""
    workflow_id: str
    status: str
    current_step: int
    total_steps: int
    current_expert: Optional[str]
    completed_experts: List[str]
    risk_level: Optional[str]


class CreateResponse(BaseModel):
    """完整创作响应"""
    workflow_id: str
    status: str
    message: str
    project_id: Optional[str] = None


class ResumeRequest(BaseModel):
    """恢复工作流，并可在下一个人工检查点前再次暂停。"""
    stop_at: Optional[str] = Field(None, description="下一次暂停前的专家ID")


class CheckpointDecisionRequest(BaseModel):
    """人工检查点决定。edited_content存在时覆盖对应专家产物。"""
    expert_id: str
    edited_content: Optional[str] = None
    stop_at: Optional[str] = None

class ProjectCreate(BaseModel):
    """新建项目请求"""
    title: str
    genre: str = ""
    original_idea: str = ""
    user_id: str = "demo_001"
    project_type: str = "original"


class ProjectUpdate(BaseModel):
    """更新项目请求"""
    title: Optional[str] = None
    status: Optional[str] = None
    current_stage: Optional[str] = None
    original_idea: Optional[str] = None
    project_type: Optional[str] = None


class ProjectResponse(BaseModel):
    """项目响应"""
    project_id: str
    user_id: str
    title: str
    project_type: str = "original"
    genre: str
    original_idea: str
    workflow_id: Optional[str] = None
    status: str
    current_stage: str
    created_at: str
    updated_at: str
    artifacts: dict


class BindWorkflowRequest(BaseModel):
    """绑定workflow请求"""
    workflow_id: str


class SaveArtifactRequest(BaseModel):
    """保存阶段产物请求"""
    stage: str
    artifact_data: dict


class AdaptationValidateRequest(BaseModel):
    """验证改编工作台快照是否满足溯源与人工检查点要求。"""
    snapshot: Dict[str, Any]




class ExpertInfo(BaseModel):
    """专家信息"""
    id: str
    name: str
    description: str
    in_sequence: bool


# ============ FastAPI应用 ============

# 全局状态
workflows: Dict[str, Orchestrator] = {}
workflow_events: Dict[str, List[Dict[str, Any]]] = {}


def _emit(workflow_id: str, event_type: str, **payload):
    events = workflow_events.setdefault(workflow_id, [])
    expert_id = payload.get("expert_id") or payload.get("target_expert")
    events.append({
        "schema_version": "1.0.0",
        "run_id": workflow_id,
        "event_id": len(events) + 1,
        "type": event_type,
        "timestamp": datetime.now().isoformat(),
        "agent": {"id": expert_id, "name": expert_id} if expert_id else None,
        "skill": skill_for(expert_id) if expert_id else None,
        **payload,
    })


def _bind_evidence_callbacks(workflow_id: str, orchestrator: Orchestrator, project_id: str = None):
    def _on_step_complete_with_save(expert_id, step_index, output):
        _emit(
            workflow_id, "expert_complete", expert_id=expert_id, step_index=step_index,
            validation_passed=output.validation_passed,
            validation_errors=output.validation_errors,
            output=output.content,
            output_preview=output.content[:800],
            structured_data=output.structured_data,
        )
        # Auto-save artifact to project if bound
        if project_id:
            try:
                project_dao = ProjectDAO()
                project = project_dao.get_project(project_id)
                if project:
                    artifacts = project.get("artifacts", {}) or {}
                    artifacts[expert_id] = {
                        "content": output.content if output.content else "",
                        "validation_passed": output.validation_passed,
                        "structured_data": output.structured_data,
                        "saved_at": datetime.now().isoformat(),
                    }
                    # Map expert to stage
                    stage_map = {
                        "\u00a70": "idea",
                        "\u00a71": "character",
                        "\u00a72": "compliance",
                        "\u00a73": "outline",
                        "\u00a74": "dialogue",
                        "\u00a75": "episode",
                        "\u00a76": "supervision",
                        "\u00a77": "visual",
                        "\u00a78": "project_config",
                        "\u00a79": "market",
                        "\u00a710": "direction",
                        "\u00a711": "style",
                        "\u00a712": "rhythm",
                        "\u00a713": "emotion",
                        "\u00a714": "conflict",
                        "\u00a715": "climax",
                        "\u00a716": "ending",
                    }
                    stage = stage_map.get(expert_id, "idea")
                    project_dao.update_project(
                        project_id,
                        current_stage=stage,
                        artifacts=artifacts,
                        status="running",
                    )
            except Exception:
                pass  # Don't break workflow on save failure

    def _on_checkpoint_with_save(expert_id, step_index, state):
        _emit(
            workflow_id, "checkpoint", expert_id=expert_id, step_index=step_index,
            completed_experts=[state.expert_sequence[i] for i in state.completed_steps],
            reason=state.error_message,
        )
        # Update project stage and status on checkpoint
        if project_id:
            try:
                project_dao = ProjectDAO()
                stage_map = {
                    "\u00a70": "idea",
                    "\u00a71": "character",
                    "\u00a72": "compliance",
                    "\u00a73": "outline",
                    "\u00a74": "dialogue",
                    "\u00a75": "episode",
                    "\u00a76": "supervision",
                    "\u00a77": "visual",
                    "\u00a78": "project_config",
                    "\u00a79": "market",
                    "\u00a710": "direction",
                    "\u00a711": "style",
                    "\u00a712": "rhythm",
                    "\u00a713": "emotion",
                    "\u00a714": "conflict",
                    "\u00a715": "climax",
                    "\u00a716": "ending",
                }
                stage = stage_map.get(expert_id, "idea")
                project_dao.update_project(
                    project_id,
                    current_stage=stage,
                    status="waiting_user",
                )
            except Exception:
                pass

    orchestrator.on("on_step_start", lambda expert_id, step_index, context: _emit(
        workflow_id, "expert_start", expert_id=expert_id, step_index=step_index,
        task=orchestrator.SEQUENCE_DESCRIPTIONS.get(expert_id, expert_id),
    ))
    orchestrator.on("on_step_complete", _on_step_complete_with_save)
    orchestrator.on("on_step_error", lambda expert_id, step_index, error: _emit(
        workflow_id, "expert_error", expert_id=expert_id, step_index=step_index, error=str(error),
    ))
    orchestrator.on("on_quality_gate", lambda expert_id, result: _emit(
        workflow_id, "quality_gate", expert_id=expert_id, result=result,
    ))
    orchestrator.on("on_checkpoint", _on_checkpoint_with_save)
    orchestrator.on("on_revision_loop", lambda revision: _emit(
        workflow_id, "revision_loop", revision=revision,
    ))
    orchestrator.on("on_decision_plan", lambda plan: _emit(
        workflow_id, "decision_plan", layer="decision", plan=plan,
    ))
    orchestrator.on("on_supervision", lambda verdict: _emit(
        workflow_id, "supervision_verdict", layer="supervision", verdict=verdict,
    ))
    orchestrator.on("on_feedback", lambda expert_id, feedback: _emit(
        workflow_id, "feedback_dispatch", layer="supervision",
        target_expert=expert_id, feedback=feedback,
    ))
    orchestrator.on("on_workflow_complete", lambda state: _emit(
        workflow_id, "workflow_state", status=state.status.value,
        current_step=state.current_step, error=state.error_message,
    ))
    orchestrator.on("on_cancelled", lambda state, reason: _emit(
        workflow_id, "workflow_canceled", status=state.status.value,
        current_step=state.current_step, reason=reason,
    ))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时加载配置
    config_file = os.getenv("DRAMA_CONFIG", "config.yaml")
    if os.path.exists(config_file):
        load_config(config_file)

    # 初始化数据库
    db = get_db()
    db.init_db()
    # 创建默认demo用户
    user_dao = UserDAO(db)
    if not user_dao.get_user("demo_001"):
        user_dao.create_user(user_id="demo_001", nickname="Demo User")

    yield
    # 关闭时清理


def create_app() -> FastAPI:
    """创建FastAPI应用"""
    config = get_config()

    app = FastAPI(
        title="Drama Engine API",
        description="精品短剧创作引擎 API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.api.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 创建LLM客户端工厂
    def create_llm_client() -> OpenAIClient:
        return OpenAIClient(
            api_key=config.llm.api_key or os.getenv("OPENAI_API_KEY", ""),
            model=config.llm.model,
            base_url=config.llm.base_url,
            temperature=config.llm.temperature,
        )

    # ============ API路由 ============

    @app.get("/")
    async def root():
        return RedirectResponse(url="/demo/")

    @app.get("/health")
    async def health():
        return {
            "status": "healthy",
            "service": "yunjiang-agent-engine",
            "version": "workflow-1.3.10",
            "checkpoint_protocol": "atomic-resume-v1",
            "llm_configured": bool(config.llm.api_key or os.getenv("OPENAI_API_KEY")),
            "model": config.llm.model,
        }

    @app.get("/api/v1/capabilities")
    async def capabilities():
        """机器可读的晋级评测入口。"""
        return {
            "schema_version": "1.0.0",
            "release": "final-1.0.0",
            "demo": "/demo/",
            "docs": "/docs",
            "agents": 17,
            "skills": len(SKILLS),
            "human_in_the_loop": {
                "checkpoints": ["角色设定", "剧情大纲", "分集剧本"],
                "actions": ["确认继续", "修改方向", "直接编辑", "取消创作", "断点恢复"],
            },
            "observability": ["SSE实时事件", "Agent Run证据", "专家输入输出", "质量门禁", "Token用量"],
            "product": ["3个场景模板", "60秒零Token体验", "Session持久化", "版本化风格包", "下游结构化导出", "文学/漫画IP改编工作台"],
        }

    @app.get("/api/v1/adaptation/schema")
    async def get_adaptation_schema():
        """返回原著事实层与改编决策层的机器可读数据契约。"""
        return adaptation_schema_manifest()

    @app.get("/api/v1/adaptation/demo")
    async def get_adaptation_demo():
        """零 Token 文学改编示例项目，可直接驱动评审 Demo。"""
        return adaptation_demo_project()

    @app.get("/api/v1/adaptation/manga/demo")
    async def get_adaptation_manga_demo():
        """零 Token 漫画拆解示例，包含页、画格、对白归属和镜头映射。"""
        return adaptation_manga_demo_project()

    @app.post("/api/v1/adaptation/validate")
    async def validate_adaptation_snapshot(request: AdaptationValidateRequest):
        snapshot = request.snapshot
        errors: List[str] = []
        for collection in ("characters", "events", "invariants", "beats", "issues"):
            for index, item in enumerate(snapshot.get(collection, [])):
                if not item.get("source_chunk_ids"):
                    errors.append(f"{collection}[{index}] 缺少 source_chunk_ids")
        invariants = snapshot.get("invariants", [])
        if invariants and not all(item.get("approved") for item in invariants):
            errors.append("故事骨架尚未全部完成人工确认")
        selected = [item for item in snapshot.get("proposals", []) if item.get("selected")]
        if not selected:
            errors.append("尚未选择任何改编方案")
        return {
            "ok": not errors,
            "schema_version": adaptation_schema_manifest()["schema_version"],
            "errors": errors,
            "checks": {
                "traceability": not any("source_chunk_ids" in error for error in errors),
                "skeleton_approved": not any("骨架" in error for error in errors),
                "proposal_selected": bool(selected),
            },
        }

    @app.get("/api/v1/style-packs")
    async def list_style_packs():
        """列出后端实际可注入的版本化风格经验包。"""
        return {"schema_version": "1.0", "packs": STYLE_PACKS.list()}

    @app.get("/api/v1/skills")
    async def list_skills():
        """List versioned skills bound to runtime agents."""
        return {"schema_version": "1.0.0", "skills": SKILLS, "count": len(SKILLS)}

    @app.get("/api/v1/style-packs/{pack_id}")
    async def get_style_pack(pack_id: str, version: Optional[str] = None):
        try:
            return STYLE_PACKS.get(pack_id, version).to_dict()
        except KeyError as error:
            raise HTTPException(status_code=404, detail=f"风格经验包不存在: {error.args[0]}")

    @app.post("/api/v1/create", response_model=CreateResponse)
    async def create_story(request: CreateRequest, background_tasks: BackgroundTasks):
        """
        启动完整创作工作流

        这是一个异步操作，工作流将在后台执行。
        使用 /api/v1/progress/{workflow_id} 查询进度。
        """
        config = get_config()
        try:
            style_pack = STYLE_PACKS.get(request.style_pack_id, request.style_pack_version).to_dict()
        except KeyError as error:
            raise HTTPException(status_code=400, detail=f"风格经验包不存在: {error.args[0]}")

        llm_client = create_llm_client()
        orchestrator = Orchestrator(
            llm_client=llm_client,
            knowledge_base_path=config.paths.experts_prompts,
            project_path=config.paths.root,
            enable_checkpoint=config.workflow.enable_checkpoint,
            use_full_sequence=True,
            enable_agent_collaboration=True,
        )

        # 初始化上下文
        from src.experts.base import ExpertContext
        context = ExpertContext(
            story_direction=request.effective_story_direction,
            project_config={
                "drama_type": request.drama_type or config.default_drama_type,
                "total_episodes": request.total_episodes or config.default_total_episodes,
                "user_materials": request.user_materials,
                "style_pack": style_pack,
            },
        )

        # 后台执行工作流
        workflow_id = f"wf_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        workflows[workflow_id] = orchestrator
        workflow_events[workflow_id] = []
        _bind_evidence_callbacks(workflow_id, orchestrator, project_id=getattr(request, "project_id", None))
        _emit(workflow_id, "workflow_created", stop_at=request.stop_at)
        _emit(workflow_id, "style_pack_loaded", style_pack={
            "id": style_pack["id"], "version": style_pack["version"],
            "name": style_pack["name"], "checksum": style_pack["checksum"],
        })

        def run_workflow():
            try:
                orchestrator.auto_develop_project(
                    idea=request.effective_story_direction,
                    project=context.project_config,
                    max_attempts=3,
                )
                state = orchestrator.run_full(
                    request.effective_story_direction,
                    stop_at=request.stop_at,
                    workflow_id=workflow_id,
                    project_config=context.project_config,
                    preserve_state=True,
                )
                _emit(workflow_id, "workflow_state", status=state.status.value,
                      current_step=state.current_step, error=state.error_message)
            except Exception as e:
                if orchestrator.state:
                    orchestrator.state.status = WorkflowStatus.FAILED
                    orchestrator.state.error_message = str(e)
                _emit(workflow_id, "workflow_error", error=str(e))

        # Bind workflow to project if project_id provided
        if request.project_id:
            try:
                project_dao = ProjectDAO()
                project_dao.update_project(request.project_id, workflow_id=workflow_id, status="running")
            except Exception:
                pass  # Don't break workflow on binding failure

        background_tasks.add_task(run_workflow)

        return CreateResponse(
            workflow_id=workflow_id,
            status="started",
            message=f"工作流已启动，workflow_id: {workflow_id}",
            project_id=request.project_id,
        )

    @app.post("/api/v1/step/{expert_id}", response_model=StepResponse)
    async def run_step(expert_id: str, request: StepRequest):
        """
        执行单个专家步骤
        """
        config = get_config()

        llm_client = create_llm_client()
        orchestrator = Orchestrator(
            llm_client=llm_client,
            knowledge_base_path=config.paths.experts_prompts,
            project_path=config.paths.root,
        )

        from src.experts.base import ExpertContext
        context = None
        if request.context:
            context = ExpertContext(**request.context)

        output = orchestrator.run_step(expert_id, context=context, user_input=request.user_input)

        return StepResponse(
            expert_id=output.expert_name,
            content=output.content,
            validation_passed=output.validation_passed,
            validation_errors=output.validation_errors,
            structured_data=output.structured_data,
        )

    @app.get("/api/v1/progress/{workflow_id}", response_model=ProgressResponse)
    async def get_progress(workflow_id: str):
        """
        查询工作流进度
        """
        if workflow_id not in workflows:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")

        orchestrator = workflows[workflow_id]
        progress = orchestrator.get_progress()

        context = orchestrator.state.context_snapshot if orchestrator.state else None

        return ProgressResponse(
            workflow_id=workflow_id,
            status=progress.get("status", "unknown"),
            current_step=progress.get("current_step", 0),
            total_steps=progress.get("total_steps", 7),
            current_expert=progress.get("current_expert"),
            completed_experts=progress.get("completed_experts", []),
            risk_level=context.risk_level if context else None,
        )

    @app.get("/api/v1/experts", response_model=List[ExpertInfo])
    async def list_experts():
        """
        列出所有可用的专家
        """
        config = get_config()
        llm_client = create_llm_client()
        orchestrator = Orchestrator(
            llm_client=llm_client,
            knowledge_base_path=config.paths.experts_prompts,
        )

        return [
            ExpertInfo(**info)
            for info in orchestrator.list_available_experts()
        ]

    @app.get("/api/v1/result/{workflow_id}")
    async def get_result(workflow_id: str):
        """
        获取工作流完整结果
        """
        if workflow_id not in workflows:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")

        orchestrator = workflows[workflow_id]
        if not orchestrator.state:
            raise HTTPException(status_code=404, detail="工作流尚未初始化")

        state = orchestrator.state
        return {
            "workflow_id": workflow_id,
            "status": state.status.value,
            "context": state.context_snapshot.to_dict() if state.context_snapshot else {},
            "outputs": {k: v.to_dict() for k, v in state.step_outputs.items()},
        }

    @app.get("/api/v1/events/{workflow_id}")
    async def stream_workflow_events(workflow_id: str, after: int = 0):
        """以SSE输出真实专家、门禁、检查点和工作流事件。"""
        if workflow_id not in workflows and workflow_id not in workflow_events:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")

        async def event_generator():
            cursor = max(0, after)
            idle_ticks = 0
            while idle_ticks < 300:
                events = workflow_events.get(workflow_id, [])
                pending = [event for event in events if event["event_id"] > cursor]
                if pending:
                    idle_ticks = 0
                    for event in pending:
                        cursor = event["event_id"]
                        yield f"id: {cursor}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
                else:
                    idle_ticks += 1
                    yield f"data: {json.dumps({'type': 'heartbeat', 'event_id': cursor})}\n\n"
                orchestrator = workflows.get(workflow_id)
                # PAUSED is not terminal: keep the SSE channel alive while the
                # user reviews a checkpoint so the same stream can deliver
                # resumed expert events without a close/reconnect race.
                terminal = orchestrator and orchestrator.state and orchestrator.state.status in {
                    WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELED,
                }
                if terminal and not [event for event in workflow_events.get(workflow_id, []) if event["event_id"] > cursor]:
                    break
                await asyncio.sleep(0.5)

        return StreamingResponse(
            event_generator(), media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @app.get("/api/v1/evidence/{workflow_id}")
    async def get_workflow_evidence(workflow_id: str):
        orchestrator = workflows.get(workflow_id)
        if not orchestrator or not orchestrator.state:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
        state = orchestrator.state
        return {
            "workflow_id": workflow_id,
            "status": state.status.value,
            "events": workflow_events.get(workflow_id, []),
            "completed_experts": [state.expert_sequence[i] for i in state.completed_steps],
            "outputs": {key: value.to_dict() for key, value in state.step_outputs.items()},
            "token_usage": orchestrator.get_token_usage_report(),
            "collaboration": orchestrator.collaboration.to_dict(),
        }

    def production_exporter(workflow_id: str) -> ProductionExportService:
        orchestrator = workflows.get(workflow_id)
        if not orchestrator:
            config = get_config()
            candidate = Orchestrator(
                knowledge_base_path=config.paths.experts_prompts,
                project_path=config.paths.root,
                use_full_sequence=True,
                enable_agent_collaboration=True,
            )
            candidate.state = candidate._load_checkpoint(workflow_id)
            if candidate.state:
                candidate.expert_sequence = list(candidate.state.expert_sequence)
                workflows[workflow_id] = candidate
                orchestrator = candidate
        if not orchestrator or not orchestrator.state or not orchestrator.state.context_snapshot:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
        story_state = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
        return ProductionExportService(story_state, orchestrator.state.step_outputs)

    @app.get("/api/v1/export/{workflow_id}")
    async def export_production_package(workflow_id: str, target: str = "generic"):
        """导出角色、场景和分镜；target支持generic/xiaoyunque/dramaclaw。"""
        try:
            package = production_exporter(workflow_id).build(workflow_id, target.lower())
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error))
        _emit(workflow_id, "production_exported", target=target.lower(), counts=package.get("counts", {}))
        return package

    @app.get("/api/v1/export/{workflow_id}/{artifact}")
    async def export_production_artifact(workflow_id: str, artifact: str):
        exporter = production_exporter(workflow_id)
        handlers = {
            "characters": exporter.characters,
            "scenes": exporter.scenes,
            "storyboard": exporter.storyboard,
        }
        if artifact not in handlers:
            raise HTTPException(status_code=404, detail="artifact仅支持characters/scenes/storyboard")
        items = handlers[artifact]()
        _emit(workflow_id, "production_artifact_exported", artifact=artifact, count=len(items))
        return {
            "schema": f"yunjiang.drama.{artifact}", "schema_version": "1.0.0",
            "workflow_id": workflow_id, "items": items, "count": len(items),
        }

    def _apply_checkpoint_decision(workflow_id: str, request: CheckpointDecisionRequest):
        orchestrator = workflows.get(workflow_id)
        if not orchestrator or not orchestrator.state:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
        state = orchestrator.state
        if state.status != WorkflowStatus.PAUSED:
            raise HTTPException(status_code=409, detail="工作流当前不在人工检查点")
        output = state.step_outputs.get(request.expert_id)
        current_expert = (
            state.expert_sequence[state.current_step]
            if 0 <= state.current_step < len(state.expert_sequence)
            else None
        )
        # A quality-gate pause deliberately removes the rejected output so the
        # same expert can run again. That is a retry decision, not an artifact
        # confirmation, and must be accepted without a stored output.
        retry_rejected_step = output is None and current_expert == request.expert_id
        if output is None and not retry_rejected_step:
            raise HTTPException(status_code=400, detail=f"专家 {request.expert_id} 尚无可确认产物")
        if output is not None and request.edited_content is not None:
            output.content = request.edited_content
            orchestrator._update_context_from_output(request.expert_id, output, state.context_snapshot)
        if retry_rejected_step:
            orchestrator.approve_next_gate_result(request.expert_id)
        orchestrator._save_checkpoint()
        _emit(workflow_id, "human_decision", expert_id=request.expert_id,
              edited=output is not None and request.edited_content is not None,
              retry=retry_rejected_step, next_stop=request.stop_at)
        return orchestrator, state, retry_rejected_step

    @app.post("/api/v1/workflow/{workflow_id}/checkpoint")
    async def save_checkpoint_decision(workflow_id: str, request: CheckpointDecisionRequest):
        orchestrator, state, retry_rejected_step = _apply_checkpoint_decision(workflow_id, request)
        return {"ok": True, "workflow_id": workflow_id, "status": state.status.value,
                "retry": retry_rejected_step}

    @app.post("/api/v1/workflow/{workflow_id}/checkpoint-and-resume")
    async def checkpoint_and_resume(workflow_id: str, request: CheckpointDecisionRequest,
                                    background_tasks: BackgroundTasks):
        """Atomically persist a human decision and schedule the same workflow to resume."""
        orchestrator, state, retry_rejected_step = _apply_checkpoint_decision(workflow_id, request)

        def run_confirmed_resume():
            try:
                resumed = orchestrator.resume(workflow_id, stop_at=request.stop_at)
                _emit(workflow_id, "workflow_state", status=resumed.status.value,
                      current_step=resumed.current_step, error=resumed.error_message)
            except Exception as error:
                _emit(workflow_id, "workflow_error", error=str(error))

        background_tasks.add_task(run_confirmed_resume)
        return {"ok": True, "workflow_id": workflow_id, "status": "resuming",
                "retry": retry_rejected_step, "stop_at": request.stop_at}

    @app.post("/api/v1/resume/{workflow_id}")
    async def resume_workflow(workflow_id: str, background_tasks: BackgroundTasks,
                              request: Optional[ResumeRequest] = None):
        """
        从断点恢复工作流
        """
        config = get_config()

        llm_client = create_llm_client()
        orchestrator = workflows.get(workflow_id) or Orchestrator(
            llm_client=llm_client,
            knowledge_base_path=config.paths.experts_prompts,
            project_path=config.paths.root,
            use_full_sequence=True,
            enable_agent_collaboration=True,
        )
        workflows[workflow_id] = orchestrator
        workflow_events.setdefault(workflow_id, [])
        _bind_evidence_callbacks(workflow_id, orchestrator)

        try:
            next_stop = request.stop_at if request else None
            def run_resume():
                try:
                    state = orchestrator.resume(workflow_id, stop_at=next_stop)
                    _emit(workflow_id, "workflow_state", status=state.status.value,
                          current_step=state.current_step, error=state.error_message)
                except Exception as error:
                    _emit(workflow_id, "workflow_error", error=str(error))
            background_tasks.add_task(run_resume)
            return {
                "workflow_id": workflow_id,
                "status": "resuming",
                "stop_at": next_stop,
                "message": "工作流恢复请求已接受",
            }
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    @app.post("/api/v1/cancel/{workflow_id}")
    async def cancel_workflow(workflow_id: str):
        """Cancel a running/paused workflow while preserving completed outputs."""
        orchestrator = workflows.get(workflow_id)
        if not orchestrator or not orchestrator.state:
            raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
        state = orchestrator.cancel("用户通过前端取消")
        _emit(workflow_id, "workflow_state", status=state.status.value,
              current_step=state.current_step, error=state.error_message)
        return {
            "ok": True,
            "workflow_id": workflow_id,
            "status": state.status.value,
            "completed_experts": [state.expert_sequence[i] for i in state.completed_steps],
            "outputs_preserved": len(state.step_outputs),
        }

    @app.websocket("/api/v1/ws/{workflow_id}")
    async def websocket_endpoint(websocket: WebSocket, workflow_id: str):
        """
        WebSocket实时对话

        支持实时接收工作流输出和发送用户输入
        """
        await websocket.accept()

        config = get_config()
        llm_client = create_llm_client()

        # 获取或创建工作流
        if workflow_id in workflows:
            orchestrator = workflows[workflow_id]
        else:
            orchestrator = Orchestrator(
                llm_client=llm_client,
                knowledge_base_path=config.paths.experts_prompts,
                project_path=config.paths.root,
            )
            workflows[workflow_id] = orchestrator

        # 注册实时回调
        async def on_step_complete(expert_id, step_idx, output):
            await websocket.send_json({
                "type": "step_complete",
                "expert_id": expert_id,
                "step_index": step_idx,
                "content": output.content[:800] if output.content else "",
                "validation_passed": output.validation_passed,
            })

        orchestrator.on("on_step_complete", on_step_complete)

        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")

                if msg_type == "start":
                    story_direction = data.get("story_direction", "")
                    orchestrator._init_workflow(story_direction)

                    await websocket.send_json({
                        "type": "started",
                        "workflow_id": orchestrator.state.workflow_id,
                    })

                    # 异步执行
                    asyncio.create_task(
                        orchestrator.run_full(story_direction)
                    )

                elif msg_type == "user_input":
                    user_input = data.get("content", "")
                    expert_id = data.get("expert_id", "§0")

                    output = orchestrator.run_step(expert_id, user_input=user_input)

                    await websocket.send_json({
                        "type": "step_output",
                        "expert_id": expert_id,
                        "content": output.content,
                        "validation_passed": output.validation_passed,
                    })

                elif msg_type == "progress":
                    progress = orchestrator.get_progress()
                    await websocket.send_json({
                        "type": "progress",
                        **progress,
                    })

        except WebSocketDisconnect:
            pass
        finally:
            await websocket.close()


    # ============ Project API ============

    @app.post("/api/v1/projects", response_model=ProjectResponse)
    async def create_project(request: ProjectCreate):
        """新建项目"""
        user_dao = UserDAO()
        project_dao = ProjectDAO()

        # Auto-create user if not exists
        if not user_dao.get_user(request.user_id):
            user_dao.create_user(user_id=request.user_id, nickname=request.user_id)

        project = project_dao.create_project(
            user_id=request.user_id,
            title=request.title,
            genre=request.genre,
            original_idea=request.original_idea,
            project_type=request.project_type,
        )
        return ProjectResponse(**project)

    @app.get("/api/v1/projects", response_model=List[ProjectResponse])
    async def list_projects(user_id: str = "demo_001"):
        """获取项目列表"""
        project_dao = ProjectDAO()
        projects = project_dao.list_projects(user_id)
        return [ProjectResponse(**p) for p in projects]

    @app.get("/api/v1/projects/{project_id}", response_model=ProjectResponse)
    async def get_project(project_id: str):
        """获取项目详情"""
        project_dao = ProjectDAO()
        project = project_dao.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"项目 {project_id} 未找到")
        return ProjectResponse(**project)

    @app.put("/api/v1/projects/{project_id}", response_model=ProjectResponse)
    async def update_project(project_id: str, request: ProjectUpdate):
        """更新项目"""
        project_dao = ProjectDAO()
        update_data = request.model_dump(exclude_none=True)
        project = project_dao.update_project(project_id, **update_data)
        if not project:
            raise HTTPException(status_code=404, detail=f"项目 {project_id} 未找到")
        return ProjectResponse(**project)

    @app.delete("/api/v1/projects/{project_id}")
    async def delete_project(project_id: str):
        """删除项目"""
        project_dao = ProjectDAO()
        success = project_dao.delete_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"项目 {project_id} 未找到")
        return {"ok": True, "project_id": project_id, "message": "项目已删除"}

    @app.post("/api/v1/projects/{project_id}/bind-workflow", response_model=ProjectResponse)
    async def bind_workflow(project_id: str, request: BindWorkflowRequest):
        """绑定workflow到项目"""
        project_dao = ProjectDAO()
        project = project_dao.update_project(project_id, workflow_id=request.workflow_id, status="running")
        if not project:
            raise HTTPException(status_code=404, detail=f"项目 {project_id} 未找到")
        return ProjectResponse(**project)

    @app.post("/api/v1/projects/{project_id}/save-artifact", response_model=ProjectResponse)
    async def save_artifact(project_id: str, request: SaveArtifactRequest):
        """保存阶段产物到项目"""
        project_dao = ProjectDAO()
        project = project_dao.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"项目 {project_id} 未找到")

        artifacts = project.get("artifacts", {}) or {}
        artifacts[request.stage] = {
            "data": request.artifact_data,
            "saved_at": datetime.now().isoformat(),
        }
        project = project_dao.update_project(project_id, artifacts=artifacts)
        return ProjectResponse(**project)

    frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
    if frontend_dir.is_dir():
        app.mount("/demo", StaticFiles(directory=str(frontend_dir), html=True), name="demo")

    return app


# 创建应用实例
app = create_app()


def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """运行API服务器"""
    import uvicorn
    uvicorn.run(
        "src.api.server:app",
        host=host,
        port=port,
        reload=reload,
    )


if __name__ == "__main__":
    run_server()
