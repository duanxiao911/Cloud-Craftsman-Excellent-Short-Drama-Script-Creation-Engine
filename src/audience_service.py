"""Model-backed Phase-4 audience audit with strict node-scoped output."""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterable, List

from src.audience_quality import AudienceExperienceTracker, CURVES
from src.experts.base import LLMClient
from src.story_state import StoryState


class AudienceAuditService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        self.tracker = AudienceExperienceTracker()

    def audit_nodes(self, state: StoryState, node_ids: Iterable[str]):
        selected = sorted(set(node_ids))
        if not selected or any(node_id not in state.nodes for node_id in selected):
            raise KeyError("自动审计只能引用明确存在的故事节点")
        payload = {node_id: state.select([node_id])[node_id] for node_id in selected}
        prompt = f"""你是短剧观众体验审计器。只输出JSON，不写Markdown。
仅审计以下节点，不得创造、改名或遗漏节点：{json.dumps(selected, ensure_ascii=False)}
节点正文：{json.dumps(payload, ensure_ascii=False)}
输出points数组，每个节点恰好一项。每项必须含node_id、episode_id、scores、evidence、signals。
scores、evidence、signals必须分别完整包含：{','.join(CURVES)}。
scores为0—10分；evidence必须引用该节点的具体人物行动、信息或结果；signals必须是简短非空的体验事实，用于检测相邻集重复。不得用“很好”“有冲突”等抽象套话。"""
        result = self.llm_client.complete_json(prompt, temperature=0.1, max_tokens=4000)
        points = result.get("points", [])
        if not isinstance(points, list) or len(points) != len(selected):
            raise ValueError("自动审计必须为每个目标节点返回且只返回一个体验点")
        returned = [point.get("node_id") for point in points if isinstance(point, dict)]
        if sorted(returned) != selected or len(set(returned)) != len(returned):
            raise ValueError("自动审计返回了越界、重复或缺失节点")
        for point in points:
            node_id = point["node_id"]
            episode_id = point.get("episode_id")
            if not isinstance(episode_id, int) or episode_id != self._episode_id(state, node_id):
                raise ValueError(f"{node_id} 的episode_id与节点不一致")
            signals = point.get("signals", {})
            if any(not str(signals.get(curve, "")).strip() for curve in CURVES):
                raise ValueError(f"{node_id} 缺少非空体验信号")
            self.tracker.record(state, episode_id, node_id, point.get("scores", {}), point.get("evidence", {}), signals)
        return self.tracker.audit(state)

    def propose_repair(self, state: StoryState, plan: Dict[str, Any]) -> Dict[str, Any]:
        target = plan.get("target")
        if target not in state.nodes:
            raise KeyError(target)
        node = state.nodes[target]
        prompt = f"""你是短剧局部改稿器。只输出JSON，不写Markdown。
问题：{plan.get('reason', '')}
唯一允许修改的节点：{target}
当前节点：{json.dumps(node.data, ensure_ascii=False)}
锁定字段：{json.dumps(plan.get('locked_elements', []), ensure_ascii=False)}
只输出changes对象，键是需要差量更新的字段路径，值是新值。不得输出整集、不得修改其他节点、不得修改锁定字段；修改必须增加人物行动、有效新信息、因果结果或下一集具体期待。"""
        result = self.llm_client.complete_json(prompt, temperature=0.2, max_tokens=1800)
        changes = result.get("changes")
        if not isinstance(changes, dict) or not changes:
            raise ValueError("局部改稿必须返回非空changes对象")
        locked = set(plan.get("locked_elements", []))
        for path in changes:
            if any(path == item or path.startswith(item + ".") for item in locked):
                raise ValueError(f"模型试图修改锁定字段: {path}")
        return changes

    @staticmethod
    def _episode_id(state: StoryState, node_id: str) -> int:
        value = state.nodes[node_id].data.get("episode_id")
        if isinstance(value, int) and value > 0:
            return value
        match = re.match(r"E(\d+)", node_id, re.IGNORECASE)
        if not match:
            raise ValueError(f"节点无法映射到集数: {node_id}")
        return int(match.group(1))
