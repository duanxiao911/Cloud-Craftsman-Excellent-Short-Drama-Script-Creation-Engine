"""
Session路由 - 四节点交互模式的API端点

所有Session相关的路由都注册到此模块，由server.py统一挂载。
"""

import json
import asyncio
import time
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from session_manager import SessionManager, HEARTBEAT_INTERVAL


# ============ 请求模型 ============

class CreateSessionRequest(BaseModel):
    auto_mode: bool = Field(False, description="是否开启极速模式（跳过审阅自动跑完）")


class BrainstormRequest(BaseModel):
    user_input: str = Field(..., description="用户输入")


class GenerateNodeRequest(BaseModel):
    episode: Optional[int] = Field(None, description="集数（仅节点④需要）")


class ReviseNodeRequest(BaseModel):
    feedback: str = Field(..., description="修改意见")


class ConfirmNodeRequest(BaseModel):
    edited_content: Optional[str] = Field(None, description="手动编辑后的内容（不传则使用AI生成版本）")


class ManualSaveRequest(BaseModel):
    content: str = Field(..., description="用户手动编辑的内容")


class GoBackRequest(BaseModel):
    target_node: int = Field(..., description="目标节点编号 1-4")


# ============ 路由注册 ============

def register_session_routes(app, session_manager: SessionManager):
    """注册所有Session路由到FastAPI应用"""

    # ============ 会话管理 ============

    @app.post("/api/v1/session/create")
    async def create_session(request: CreateSessionRequest):
        """创建新创作会话"""
        session = session_manager.create_session(auto_mode=request.auto_mode)
        return {
            "session_id": session.session_id,
            "created_at": session.created_at,
            "auto_mode": session.auto_mode,
            "phase": session.current_phase,
        }

    @app.get("/api/v1/session/{session_id}/state")
    async def get_session_state(session_id: str):
        """获取会话当前状态"""
        try:
            session = session_manager.get_session(session_id)
            return {"ok": True, "state": session.get_state_summary()}
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    @app.get("/api/v1/session/{session_id}/node/{node}/content")
    async def get_node_content(session_id: str, node: int):
        """获取指定节点的内容（已确认版本或待确认草稿）"""
        try:
            session = session_manager.get_session(session_id)
            key = str(node)
            confirmed = session.confirmed_nodes.get(key, "")
            pending = session.pending_drafts.get(key, "")
            return {
                "ok": True,
                "node": node,
                "confirmed_content": confirmed,
                "pending_content": pending,
                "revision_count": session.revision_counts.get(node, 0),
                "max_revisions": 3,
                "is_invalidated": node in session.invalidated_nodes,
            }
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    @app.get("/api/v1/session/{session_id}/brainstorm/history")
    async def get_brainstorm_history(session_id: str):
        """获取创意捕手对话历史"""
        try:
            session = session_manager.get_session(session_id)
            return {
                "ok": True,
                "history": session.brainstorm_history,
                "confirmed": session.brainstorm_confirmed,
            }
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    @app.post("/api/v1/session/{session_id}/brainstorm/confirm")
    async def confirm_brainstorm(session_id: str):
        """确认创意捕手阶段，进入节点①"""
        try:
            session = session_manager.get_session(session_id)
            await session_manager.confirm_brainstorm(session)
            return {
                "ok": True,
                "message": "创意方向已确认，进入节点①故事大纲",
                "current_node": session.current_node,
            }
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    # ============ 流式接口（SSE） ============

    @app.post("/api/v1/session/{session_id}/brainstorm/stream")
    async def brainstorm_stream(session_id: str, request: BrainstormRequest):
        """创意捕手对话 - SSE流式返回"""
        try:
            session = session_manager.get_session(session_id)
        except ValueError as e:
            return {"ok": False, "error": str(e)}

        http_client = app.state.http_client
        llm_config = _get_llm_config()

        async def event_generator():
            # 心跳任务
            heartbeat_task = asyncio.create_task(_heartbeat_loop())

            try:
                async for event in session_manager.brainstorm_stream(
                    session, request.user_input, http_client, llm_config
                ):
                    # 每次有数据时重置心跳计数
                    yield event
            finally:
                heartbeat_task.cancel()

        async def _heartbeat_loop():
            """SSE心跳"""
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL)
                # 心跳通过主循环的chunk/done事件自然维持连接
                # 如果长时间无数据，前端会断开

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    @app.post("/api/v1/session/{session_id}/node/{node}/generate/stream")
    async def generate_node_stream(session_id: str, node: int, request: GenerateNodeRequest = None):
        """生成指定节点内容 - SSE流式返回"""
        try:
            session = session_manager.get_session(session_id)
        except ValueError as e:
            return {"ok": False, "error": str(e)}

        http_client = app.state.http_client
        llm_config = _get_llm_config()
        episode = request.episode if request else None

        async def event_generator():
            async for event in session_manager.generate_node_stream(
                session, node, http_client, llm_config, episode=episode
            ):
                yield event
            # 生成完毕后发送心跳保活
            yield _heartbeat_event()

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    @app.post("/api/v1/session/{session_id}/node/{node}/revise/stream")
    async def revise_node_stream(session_id: str, node: int, request: ReviseNodeRequest):
        """AI修改指定节点 - SSE流式返回"""
        try:
            session = session_manager.get_session(session_id)
        except ValueError as e:
            return {"ok": False, "error": str(e)}

        http_client = app.state.http_client
        llm_config = _get_llm_config()

        async def event_generator():
            async for event in session_manager.revise_node_stream(
                session, node, request.feedback, http_client, llm_config
            ):
                yield event

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # ============ 非流式操作接口 ============

    @app.post("/api/v1/session/{session_id}/node/{node}/confirm")
    async def confirm_node(session_id: str, node: int, request: ConfirmNodeRequest = None):
        """确认节点内容"""
        try:
            session = session_manager.get_session(session_id)
            edited_content = request.edited_content if request else None
            await session_manager.confirm_node(session, node, edited_content)
            return {
                "ok": True,
                "message": f"节点{node}已确认",
                "next_node": session.current_node,
                "phase": session.current_phase,
            }
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    @app.post("/api/v1/session/{session_id}/node/{node}/manual-save")
    async def manual_save(session_id: str, node: int, request: ManualSaveRequest):
        """保存用户手动编辑的内容"""
        try:
            session = session_manager.get_session(session_id)
            session_manager.manual_save(session, node, request.content)
            return {"ok": True, "message": f"节点{node}手动编辑已保存"}
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    @app.post("/api/v1/session/{session_id}/go-back")
    async def go_back(session_id: str, request: GoBackRequest):
        """回退到指定节点"""
        try:
            session = session_manager.get_session(session_id)
            current = session.current_node
            session_manager.go_back(session, current, request.target_node)
            return {
                "ok": True,
                "message": f"已从节点{current}回退到节点{request.target_node}",
                "invalidated_nodes": session.invalidated_nodes,
            }
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    # ============ SSE断线重连 ============

    @app.get("/api/v1/session/{session_id}/stream/resume")
    async def resume_stream(session_id: str, last_event_id: int = 0):
        """SSE断线重连 - 从指定事件ID之后恢复"""
        try:
            session = session_manager.get_session(session_id)
        except ValueError as e:
            return {"ok": False, "error": str(e)}

        # 找到last_event_id之后的所有事件
        missed_events = [
            e for e in session.event_log
            if e.get("event_id", 0) > last_event_id
        ]

        async def event_generator():
            # 先补发错过的事件
            for event in missed_events:
                yield f'data: {json.dumps({"type": "resume", "event_id": event["event_id"], "data": event["data"]}, ensure_ascii=False)}\n\n'

            # 然后发送当前状态
            yield f'data: {json.dumps({"type": "state_sync", "state": session.get_state_summary()}, ensure_ascii=False)}\n\n'

            # 心跳保活
            for _ in range(10):
                yield _heartbeat_event()
                await asyncio.sleep(HEARTBEAT_INTERVAL)

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # ============ 辅助函数 ============

    def _get_llm_config() -> dict:
        import os
        return {
            "api_key": os.getenv("OPENAI_API_KEY", os.getenv("LLM_API_KEY", "")),
            "base_url": os.getenv("OPENAI_BASE_URL", os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")),
            "model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
        }

    def _heartbeat_event() -> str:
        return f'data: {json.dumps({"type": "heartbeat", "timestamp": int(time.time())})}\n\n'
