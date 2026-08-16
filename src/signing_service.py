"""Observed, evidence-backed narrative commissioning assessment."""
from __future__ import annotations

import json
from typing import Any, Dict

from src.experts.base import LLMClient
from src.signing_audit import NarrativeQualityAuditor
from src.story_state import StoryState


class SigningQualityService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def assess(self, state: StoryState) -> Dict[str, Any]:
        episodes = {node.id: node.data for node in state.nodes.values() if node.kind == "episode" and node.data.get("episode_id") in (1, 2, 3)}
        prompt = f"""你是短剧平台签约终审。只输出JSON，不写Markdown。
项目：{json.dumps(state.project, ensure_ascii=False)}
立项与主线：{json.dumps(state.premise, ensure_ascii=False)}
故事发动机：{json.dumps(state.engine, ensure_ascii=False)}
前3集：{json.dumps(episodes, ensure_ascii=False)}
输出scores、evidence、decision。scores和evidence必须完整包含：{','.join(NarrativeQualityAuditor.DIMENSIONS)}。
每项0—10分，evidence必须引用具体集数、人物行动、信息或结果，不能只说“完整”“有吸引力”。
重点判断是否真的想点下一集，而不是字段是否存在。任一项低于7时decision只能为revise/reject；全部不低于7时decision为pass。"""
        assessment = self.llm_client.complete_json(prompt, temperature=0.1, max_tokens=3000)
        return {"assessment": assessment, "gate": NarrativeQualityAuditor().audit(assessment).to_dict()}
