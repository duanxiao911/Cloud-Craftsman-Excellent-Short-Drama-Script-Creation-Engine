"""
Session管理器 - 四节点交互模式

管理用户创作会话的完整生命周期：
- 创意捕手对话（brainstorm）
- 节点①②③④ 生成/修改/确认
- 手动编辑保存
- 上下文压缩
- 节点回退与数据失效
- Token/频次控制
- JSON文件持久化
"""

import os
import json
import uuid
import time
import asyncio
import httpx
from typing import Optional, Dict, Any, List, AsyncGenerator
from datetime import datetime, timedelta
from pathlib import Path


# ============ 常量 ============

MAX_REVISIONS_PER_NODE = 3          # 每节点最多AI修改轮次
MAX_API_CALLS_PER_HOUR = 30         # 单Session每小时最多API调用
CONTEXT_SUMMARY_MAX_CHARS = 500     # 上下文压缩后最大字数
HEARTBEAT_INTERVAL = 15             # SSE心跳间隔（秒）

NODE_LABELS = {
    1: "故事大纲",
    2: "人物小传",
    3: "分集大纲",
    4: "正剧剧本",
}

# 各节点使用的专家（按执行顺序）
NODE_EXPERTS = {
    1: ["project_configurator", "story_director", "structure_architect", "business_strategist"],
    2: ["character_forger", "script_reviewer"],
    3: ["episode_outline_reviewer", "episode_writer", "quality_director"],
    4: ["dialogue_master", "scene_craftsman", "visual_director", "format_craftsman",
        "revision_editor", "compliance_guard", "script_reviewer"],
}

# 各节点生成的系统提示词
NODE_SYSTEM_PROMPTS = {
    1: """你是云匠引擎的故事大纲生成模块。请基于用户的创意方向，生成一份完整的「故事大纲」。

大纲必须包含：
1. **项目名称**（暂定）
2. **故事类型**（如：都市/古装/悬疑/甜宠等）
3. **集数规划**（建议集数及每集时长）
4. **核心人物**（主角2-3人简述）
5. **故事梗概**（800-1500字，包含起承转合）
6. **核心冲突**（主线矛盾是什么）
7. **情感基调**（整体情绪走向）
8. **商业卖点**（3-5个核心卖点）

要求：逻辑严密、人物动机合理、冲突有层次递进。""",

    2: """你是云匠引擎的人物小传生成模块。请基于已确认的故事大纲，生成完整的「人物小传」。

每个角色必须包含：
1. **基本信息**（姓名/年龄/身份/外貌特征）
2. **性格画像**（核心性格+隐性特质）
3. **人物弧光**（从A到B的成长/堕落轨迹）
4. **核心动机**（驱动力是什么）
5. **关键关系**（与其他角色的关系网）
6. **经典台词**（3句代表性格的台词）

主角小传不少于500字，配角不少于300字。""",

    3: """你是云匠引擎的分集大纲生成模块。请基于已确认的故事大纲和人物小传，生成完整的「分集大纲」。

每集必须包含：
1. **集标题**（4-8字，有吸引力）
2. **核心事件**（本集最重要的1-2件事）
3. **情感节拍**（情绪起伏曲线）
4. **场景列表**（主要场景2-4个）
5. **钩子/悬念**（结尾留什么钩子吸引看下集）

整体要求：
- 节奏张弛有度，不能连续3集都是低谷或高潮
- 每集结尾必须有悬念钩子
- 前3集是黄金期，必须有强力钩子抓住观众""",

    4: """你是云匠引擎的正剧剧本生成模块。请基于已确认的分集大纲，生成「第{episode}集」的完整剧本。

剧本格式要求：
1. **场景标题**：场景号 + 内/外景 + 地点 + 时间（如：S01 内景 咖啡厅 日）
2. **场景描写**：环境氛围、视觉元素（100-200字）
3. **角色动作**：动作描写用现在时态
4. **对白**：角色名+台词，台词要有角色个人语感
5. **镜头提示**：关键画面的镜头语言标注（可选）

本集要求：
- 场景数：5-10个
- 总字数：5000-8000字
- 必须包含本集大纲中的核心事件和钩子
- 对白要自然，避免说教式台词""",
}


# ============ Session数据结构 ============

class Session:
    """创作会话"""

    def __init__(self, session_id: str = None):
        self.session_id = session_id or f"sess_{uuid.uuid4().hex[:12]}"
        self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at

        # 当前状态
        self.current_node = 0         # 0=未开始, 1-4=当前节点
        self.current_phase = "idle"   # idle/brainstorming/generating/reviewing/transitioning/complete
        self.auto_mode = False        # 极速模式（跳过审阅自动跑完）

        # 创意捕手对话
        self.brainstorm_history = []  # [{role: "user"/"assistant", content: "..."}]
        self.brainstorm_confirmed = False

        # 节点数据
        self.confirmed_nodes = {}     # {1: "content", 2: "content", ...}
        self.pending_drafts = {}      # {1: "content", ...} 未确认的草稿
        self.invalidated_nodes = []   # [3, 4] 已失效的节点
        self.revision_counts = {1: 0, 2: 0, 3: 0, 4: 0}

        # 上下文压缩缓存
        self.compressed_contexts = {} # {2: "压缩后的节点①摘要", 3: "...", ...}

        # Token/频次控制
        self.total_tokens_used = 0
        self.api_call_count = 0
        self.call_timestamps = []     # 每次调用的时间戳，用于滑动窗口限流

        # SSE事件追踪（用于断线重连）
        self.event_log = []           # [{event_id, event_type, data, timestamp}]
        self.current_stream_id = None

    def to_dict(self) -> dict:
        """序列化为字典"""
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "current_node": self.current_node,
            "current_phase": self.current_phase,
            "auto_mode": self.auto_mode,
            "brainstorm_history": self.brainstorm_history,
            "brainstorm_confirmed": self.brainstorm_confirmed,
            "confirmed_nodes": self.confirmed_nodes,
            "pending_drafts": self.pending_drafts,
            "invalidated_nodes": self.invalidated_nodes,
            "revision_counts": self.revision_counts,
            "compressed_contexts": self.compressed_contexts,
            "total_tokens_used": self.total_tokens_used,
            "api_call_count": self.api_call_count,
            "call_timestamps": self.call_timestamps,
            "event_log": self.event_log[-100:],  # 只保留最近100条事件
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Session':
        """从字典反序列化"""
        session = cls(data.get("session_id"))
        session.created_at = data.get("created_at", session.created_at)
        session.updated_at = data.get("updated_at", session.updated_at)
        session.current_node = data.get("current_node", 0)
        session.current_phase = data.get("current_phase", "idle")
        session.auto_mode = data.get("auto_mode", False)
        session.brainstorm_history = data.get("brainstorm_history", [])
        session.brainstorm_confirmed = data.get("brainstorm_confirmed", False)
        session.confirmed_nodes = data.get("confirmed_nodes", {})
        session.pending_drafts = data.get("pending_drafts", {})
        session.invalidated_nodes = data.get("invalidated_nodes", [])
        session.revision_counts = data.get("revision_counts", {1: 0, 2: 0, 3: 0, 4: 0})
        session.compressed_contexts = data.get("compressed_contexts", {})
        session.total_tokens_used = data.get("total_tokens_used", 0)
        session.api_call_count = data.get("api_call_count", 0)
        session.call_timestamps = data.get("call_timestamps", [])
        session.event_log = data.get("event_log", [])
        return session

    def get_state_summary(self) -> dict:
        """获取状态摘要（给前端用的精简版）"""
        return {
            "session_id": self.session_id,
            "current_node": self.current_node,
            "current_phase": self.current_phase,
            "auto_mode": self.auto_mode,
            "brainstorm_confirmed": self.brainstorm_confirmed,
            "confirmed_nodes": {k: len(v) for k, v in self.confirmed_nodes.items()},  # 只返回字数
            "pending_drafts": {k: len(v) for k, v in self.pending_drafts.items()},
            "invalidated_nodes": self.invalidated_nodes,
            "revision_counts": self.revision_counts,
            "total_tokens_used": self.total_tokens_used,
            "api_call_count": self.api_call_count,
        }


# ============ Session管理器 ============

class SessionManager:
    """Session管理器 - 负责Session的创建/读取/保存/删除"""

    def __init__(self, sessions_dir: str = "sessions"):
        self.sessions_dir = Path(sessions_dir)
        self.sessions_dir.mkdir(exist_ok=True)
        self._sessions: Dict[str, Session] = {}

    def create_session(self, auto_mode: bool = False) -> Session:
        """创建新会话"""
        session = Session()
        session.auto_mode = auto_mode
        session.current_phase = "idle"
        self._sessions[session.session_id] = session
        self._save_session(session)
        return session

    def get_session(self, session_id: str) -> Session:
        """获取会话（优先内存缓存，否则从文件加载）"""
        if session_id in self._sessions:
            return self._sessions[session_id]
        session = self._load_session(session_id)
        if session:
            self._sessions[session_id] = session
            return session
        raise ValueError(f"Session {session_id} 不存在")

    def _save_session(self, session: Session):
        """持久化到JSON文件"""
        session.updated_at = datetime.now().isoformat()
        filepath = self.sessions_dir / f"{session.session_id}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(session.to_dict(), f, ensure_ascii=False, indent=2)

    def _load_session(self, session_id: str) -> Optional[Session]:
        """从JSON文件加载"""
        filepath = self.sessions_dir / f"{session_id}.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            return Session.from_dict(data)
        return None

    def list_sessions(self) -> List[dict]:
        """列出所有会话（摘要）"""
        results = []
        for filepath in self.sessions_dir.glob("sess_*.json"):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                results.append({
                    "session_id": data.get("session_id"),
                    "created_at": data.get("created_at"),
                    "current_node": data.get("current_node", 0),
                    "current_phase": data.get("current_phase", "idle"),
                })
            except Exception:
                continue
        return results

    # ============ 频次控制 ============

    def _check_rate_limit(self, session: Session):
        """检查是否超过频次限制"""
        now = time.time()
        # 清理1小时前的记录
        session.call_timestamps = [t for t in session.call_timestamps if now - t < 3600]
        if len(session.call_timestamps) >= MAX_API_CALLS_PER_HOUR:
            raise ValueError(
                f"已达频次上限（{MAX_API_CALLS_PER_HOUR}次/小时），请稍后再试，或手动编辑当前内容"
            )

    def _record_api_call(self, session: Session):
        """记录一次API调用"""
        session.api_call_count += 1
        session.call_timestamps.append(time.time())

    # ============ 核心流程方法 ============

    async def brainstorm_stream(
        self, session: Session, user_input: str,
        http_client: httpx.AsyncClient, llm_config: dict
    ) -> AsyncGenerator[str, None]:
        """创意捕手对话 - 流式返回"""
        self._check_rate_limit(session)

        if session.brainstorm_confirmed:
            yield self._sse_event("error", {"message": "创意捕手阶段已结束"})
            return

        session.current_phase = "brainstorming"

        # 构建对话消息
        messages = [
            {"role": "system", "content": self._brainstorm_system_prompt()}
        ]
        # 加入历史对话
        for msg in session.brainstorm_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        # 当前用户输入
        messages.append({"role": "user", "content": user_input})

        # 记录用户消息
        session.brainstorm_history.append({"role": "user", "content": user_input})

        # 流式调用LLM
        full_response = ""
        event_id = len(session.event_log)

        async for chunk in self._stream_llm(messages, http_client, llm_config):
            if chunk["type"] == "chunk":
                full_response += chunk["content"]
                yield self._sse_event("chunk", {"content": chunk["content"], "event_id": event_id})
            elif chunk["type"] == "error":
                yield self._sse_event("error", {"message": chunk["message"]})
                return
            elif chunk["type"] == "done":
                break

        # 记录AI回复
        session.brainstorm_history.append({"role": "assistant", "content": full_response})
        session.event_log.append({
            "event_id": event_id,
            "event_type": "brainstorm_response",
            "data": full_response[:500],
            "timestamp": datetime.now().isoformat(),
        })
        self._record_api_call(session)
        self._save_session(session)

        yield self._sse_event("done", {
            "message": "创意捕手回复完成",
            "turn_count": len([m for m in session.brainstorm_history if m["role"] == "user"]),
        })

    async def confirm_brainstorm(self, session: Session):
        """确认创意捕手阶段，进入节点①"""
        session.brainstorm_confirmed = True
        session.current_node = 1
        session.current_phase = "generating"
        self._save_session(session)

    async def generate_node_stream(
        self, session: Session, node: int,
        http_client: httpx.AsyncClient, llm_config: dict,
        episode: int = None
    ) -> AsyncGenerator[str, None]:
        """生成指定节点内容 - 流式返回"""
        self._check_rate_limit(session)

        if node != session.current_node:
            yield self._sse_event("error", {"message": f"当前节点为{session.current_node}，不能生成节点{node}"})
            return

        session.current_phase = "generating"

        # 构建系统提示词
        system_prompt = NODE_SYSTEM_PROMPTS.get(node, "")
        if node == 4 and episode:
            system_prompt = system_prompt.replace("{episode}", str(episode))

        # 构建上下文
        context = self._build_node_context(session, node)

        messages = [
            {"role": "system", "content": system_prompt + context},
            {"role": "user", "content": "请开始生成。"},
        ]

        full_content = ""
        event_id = len(session.event_log)

        async for chunk in self._stream_llm(messages, http_client, llm_config):
            if chunk["type"] == "chunk":
                full_content += chunk["content"]
                yield self._sse_event("chunk", {"content": chunk["content"], "event_id": event_id})
            elif chunk["type"] == "error":
                yield self._sse_event("error", {"message": chunk["message"]})
                return
            elif chunk["type"] == "done":
                break

        # 保存为待确认草稿
        if node == 4 and episode:
            key = f"4_{episode}"
        else:
            key = str(node)
        session.pending_drafts[key] = full_content
        session.current_phase = "reviewing"

        session.event_log.append({
            "event_id": event_id,
            "event_type": f"node_{node}_generated",
            "data": f"节点{node}生成完成，共{len(full_content)}字",
            "timestamp": datetime.now().isoformat(),
        })
        self._record_api_call(session)
        self._save_session(session)

        yield self._sse_event("done", {
            "message": f"节点{node}（{NODE_LABELS.get(node, '')}）生成完成",
            "content_length": len(full_content),
        })

    async def confirm_node(self, session: Session, node: int, edited_content: str = None):
        """确认节点内容（可能是AI生成的，也可能是用户手动编辑的）"""
        key = str(node)

        if edited_content is not None:
            content = edited_content
        elif key in session.pending_drafts:
            content = session.pending_drafts[key]
        else:
            raise ValueError(f"节点{node}没有待确认的内容")

        session.confirmed_nodes[key] = content
        session.revision_counts[node] = session.revision_counts.get(node, 0)
        # 清除草稿
        if key in session.pending_drafts:
            del session.pending_drafts[key]

        # 清除该节点的失效标记
        if node in session.invalidated_nodes:
            session.invalidated_nodes.remove(node)

        # 如果是最后一个节点，标记完成
        if node == 4:
            session.current_phase = "complete"
        else:
            # 上下文压缩：为下一个节点准备
            next_node = node + 1
            await self._compress_context(session, node, next_node)
            session.current_node = next_node
            session.current_phase = "reviewing"  # 等待用户确认进入生成

        self._save_session(session)

    async def revise_node_stream(
        self, session: Session, node: int, revision_feedback: str,
        http_client: httpx.AsyncClient, llm_config: dict
    ) -> AsyncGenerator[str, None]:
        """AI修改指定节点 - 流式返回"""
        self._check_rate_limit(session)

        key = str(node)
        if session.revision_counts.get(node, 0) >= MAX_REVISIONS_PER_NODE:
            yield self._sse_event("error", {
                "message": f"节点{node}已达到最大修改轮次（{MAX_REVISIONS_PER_NODE}轮），请使用手动编辑模式",
                "code": "revision_limit",
            })
            return

        if session.current_node != node:
            yield self._sse_event("error", {"message": f"当前不在节点{node}"})
            return

        session.current_phase = "generating"
        session.revision_counts[node] = session.revision_counts.get(node, 0) + 1

        # 获取当前内容
        current_content = session.pending_drafts.get(key, session.confirmed_nodes.get(key, ""))

        # 构建修改请求
        system_prompt = NODE_SYSTEM_PROMPTS.get(node, "")
        context = self._build_node_context(session, node)

        messages = [
            {"role": "system", "content": system_prompt + context},
            {"role": "user", "content": f"以下是当前内容：\n\n{current_content}\n\n---\n\n请根据以下修改意见进行修改：\n{revision_feedback}\n\n请直接输出修改后的完整内容，不要解释修改原因。"},
        ]

        full_content = ""
        event_id = len(session.event_log)

        async for chunk in self._stream_llm(messages, http_client, llm_config):
            if chunk["type"] == "chunk":
                full_content += chunk["content"]
                yield self._sse_event("chunk", {"content": chunk["content"], "event_id": event_id})
            elif chunk["type"] == "error":
                yield self._sse_event("error", {"message": chunk["message"]})
                # 回滚修改次数
                session.revision_counts[node] -= 1
                return
            elif chunk["type"] == "done":
                break

        # 更新待确认草稿
        session.pending_drafts[key] = full_content
        session.current_phase = "reviewing"
        self._record_api_call(session)
        self._save_session(session)

        yield self._sse_event("done", {
            "message": f"节点{node}修改完成（第{session.revision_counts[node]}轮）",
            "revision_count": session.revision_counts[node],
            "remaining_revisions": MAX_REVISIONS_PER_NODE - session.revision_counts[node],
        })

    def manual_save(self, session: Session, node: int, content: str):
        """保存用户手动编辑的内容"""
        if session.current_node != node and session.current_phase != "complete":
            raise ValueError(f"当前不在节点{node}")
        key = str(node)
        session.pending_drafts[key] = content
        self._save_session(session)

    def go_back(self, session: Session, from_node: int, to_node: int):
        """回退到指定节点"""
        if to_node >= from_node:
            raise ValueError("目标节点必须小于当前节点")
        if to_node < 1:
            raise ValueError("不能回退到创意捕手之前的阶段")

        # 标记下游节点失效
        self._invalidate_downstream(session, to_node)
        session.current_node = to_node
        session.current_phase = "reviewing"
        self._save_session(session)

    # ============ 内部辅助方法 ============

    def _build_node_context(self, session: Session, target_node: int) -> str:
        """为指定节点构建上下文"""
        parts = []

        # 创意捕手摘要
        if session.brainstorm_history:
            # 取最后几轮对话作为摘要
            recent = session.brainstorm_history[-6:]  # 最近3轮对话
            summary = "\n".join([f"{'用户' if m['role']=='user' else 'AI'}：{m['content'][:200]}" for m in recent])
            parts.append(f"【创意捕手对话摘要】\n{summary}")

        # 已确认的节点内容
        for i in range(1, target_node):
            key = str(i)
            if key in session.confirmed_nodes:
                content = session.confirmed_nodes[key]
                # 如果有压缩版本就用压缩版
                if i in session.compressed_contexts:
                    content = session.compressed_contexts[i]
                else:
                    # 截断过长内容
                    if len(content) > 3000:
                        content = content[:3000] + "\n...(内容已截断)"
                parts.append(f"【已确认的{NODE_LABELS.get(i, f'节点{i}')}】\n{content}")

        if not parts:
            return ""
        return "\n\n" + "\n\n---\n\n".join(parts)

    async def _compress_context(self, session: Session, completed_node: int, next_node: int):
        """压缩已完成节点的上下文"""
        content = session.confirmed_nodes.get(str(completed_node), "")
        if len(content) <= CONTEXT_SUMMARY_MAX_CHARS:
            # 内容够短，不需要压缩
            session.compressed_contexts[completed_node] = content
            return

        # 调用LLM压缩
        prompt = f"""请将以下内容压缩为{CONTEXT_SUMMARY_MAX_CHARS}字以内的摘要，保留关键信息（人物、事件、冲突、转折点），去除细节描写。

{content[:5000]}"""

        messages = [
            {"role": "system", "content": "你是文本压缩助手，负责精炼文本保留核心信息。只输出压缩后的内容，不要任何解释。"},
            {"role": "user", "content": prompt},
        ]

        # 注意：这里不能访问http_client，因为可能在session方法中调用
        # 实际压缩会在server层完成，这里先标记
        session.compressed_contexts[completed_node] = content[:CONTEXT_SUMMARY_MAX_CHARS]

    def _invalidate_downstream(self, session: Session, node: int):
        """使指定节点之后的所有节点失效"""
        for n in range(node + 1, 5):
            key = str(n)
            if key in session.confirmed_nodes:
                session.invalidated_nodes.append(n)
            # 清除已确认内容和压缩缓存
            session.confirmed_nodes.pop(key, None)
            session.pending_drafts.pop(key, None)
            session.compressed_contexts.pop(n, None)
            session.revision_counts[n] = 0

    async def _stream_llm(self, messages: List[Dict], http_client: httpx.AsyncClient, llm_config: dict) -> AsyncGenerator[Dict, None]:
        """调用LLM API流式返回"""
        api_key = llm_config.get("api_key", "")
        base_url = llm_config.get("base_url", "https://api.openai.com/v1").rstrip("/")
        model = llm_config.get("model", "gpt-4o-mini")

        if not api_key:
            yield {"type": "error", "message": "未配置API Key"}
            return

        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": 4096,
            "stream": True,
        }

        try:
            async with http_client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    yield {"type": "error", "message": f"LLM API返回{response.status_code}: {error_body.decode()[:300]}"}
                    return

                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        yield {"type": "done", "total_tokens": -1}
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield {"type": "chunk", "content": content}
                    except json.JSONDecodeError:
                        continue

        except httpx.TimeoutException:
            yield {"type": "error", "message": "LLM API调用超时（120秒）"}
        except Exception as e:
            yield {"type": "error", "message": f"流式调用异常: {str(e)[:200]}"}

    def _sse_event(self, event_type: str, data: dict) -> str:
        """格式化SSE事件"""
        return f'data: {json.dumps({"type": event_type, **data}, ensure_ascii=False)}\n\n'

    def _brainstorm_system_prompt(self) -> str:
        """创意捕手系统提示词"""
        return """你是「创意捕手」，云匠引擎的创意引导专家。

你的任务是通过轻松有趣的对话，帮助用户把模糊的创作想法变成清晰的故事方向。

**追问维度**（每次最多问2个，不要一次全问）：
1. 核心人物 — 主角是谁？有什么特别的身份/性格/处境？
2. 核心冲突 — 他/她面临什么困境？想要什么？阻碍是什么？
3. 情感基调 — 整体是热血/虐心/治愈/烧脑/搞笑？
4. 类型偏好 — 都市/古装/悬疑/甜宠/科幻/其他？
5. 目标受众 — 主要给谁看？年龄段？
6. 故事来源 — 有没有真实事件/小说/灵感来源？

**对话风格**：
- 轻松自然，像朋友聊天
- 对用户想法给予肯定后再引导
- 每次回复不超过200字
- 当收集到足够信息时，输出一段「故事方向确认」摘要（200字以内），让用户确认

**注意**：不要替用户做决定，只做引导和提炼。"""
