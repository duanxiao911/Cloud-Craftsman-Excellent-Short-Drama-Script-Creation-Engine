"""Automatic project assessment and story-engine repair loop."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional

from src.development_gate import ASSESSMENT_DIMENSIONS, ProjectEvaluator, StoryEngineValidator
from src.experts.base import LLMClient


@dataclass
class DevelopmentRun:
    passed: bool
    assessment: Dict[str, Any]
    assessment_gate: Dict[str, Any]
    engine: Optional[Dict[str, Any]]
    engine_gate: Optional[Dict[str, Any]]
    assessment_attempts: int
    engine_attempts: int
    developed_idea: str

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__.copy()


class ProjectDevelopmentService:
    def __init__(self, llm_client: LLMClient, max_attempts: int = 3):
        self.llm_client = llm_client
        self.max_attempts = max_attempts
        self.evaluator = ProjectEvaluator()
        self.engine_validator = StoryEngineValidator()

    def develop(self, idea: str, project: Optional[Dict[str, Any]] = None) -> DevelopmentRun:
        assessment, assessment_gate, assessment_attempts, developed_idea = self._repair_assessment(idea, project or {})
        if not assessment_gate["passed"]:
            return DevelopmentRun(False, assessment, assessment_gate, None, None, assessment_attempts, 0, developed_idea)
        engine, engine_gate, engine_attempts = self._repair_engine(developed_idea, assessment)
        return DevelopmentRun(engine_gate["passed"], assessment, assessment_gate, engine, engine_gate, assessment_attempts, engine_attempts, developed_idea)

    def _repair_assessment(self, idea: str, project: Dict[str, Any]):
        previous: Dict[str, Any] = {}
        working_idea = idea
        gate = None
        for attempt in range(1, self.max_attempts + 1):
            prompt = self._assessment_prompt(working_idea, project, previous, gate)
            previous = self.llm_client.complete_json(prompt, temperature=0.2, max_tokens=2500)
            self._normalize_assessment_decision(previous)
            gate = self.evaluator.evaluate(previous).to_dict()
            if gate["passed"]:
                return previous, gate, attempt, working_idea
            revised = str(previous.get("revised_idea", "")).strip()
            if revised and revised != working_idea:
                working_idea = revised
        return previous, gate, self.max_attempts, working_idea

    @staticmethod
    def _normalize_assessment_decision(proposal: Dict[str, Any]) -> None:
        scores = proposal.get("scores", {})
        evidence = proposal.get("evidence", {})
        values = [scores.get(key) for key in ASSESSMENT_DIMENSIONS]
        complete = all(isinstance(value, (int, float)) and 0 <= value <= 10 for value in values)
        evidenced = all(str(evidence.get(key, "")).strip() for key in ASSESSMENT_DIMENSIONS)
        if not complete or not evidenced:
            return
        model_decision = proposal.get("decision")
        if min(values) < 4:
            policy_decision = "reject"
        elif min(values) < ProjectEvaluator.PASS_SCORE:
            policy_decision = "revise"
        else:
            policy_decision = "pass"
        proposal["model_decision"] = model_decision
        proposal["decision"] = policy_decision
        proposal["decision_policy_applied"] = "min_dimension: reject<4, revise<7, pass>=7"

    def _repair_engine(self, idea: str, assessment: Dict[str, Any]):
        previous: Dict[str, Any] = {}
        gate = None
        for attempt in range(1, self.max_attempts + 1):
            prompt = self._engine_prompt(idea, assessment, previous, gate)
            previous = self.llm_client.complete_json(prompt, temperature=0.3, max_tokens=5000)
            gate = self.engine_validator.validate(previous).to_dict()
            if gate["passed"]:
                return previous, gate, attempt
        return previous, gate, self.max_attempts

    @staticmethod
    def _assessment_prompt(idea, project, previous, gate) -> str:
        repair = json.dumps({"previous": previous, "gate": gate}, ensure_ascii=False) if gate else "首次评估"
        return f"""你是短剧立项委员会。只输出JSON，不写Markdown。
创意：{idea}
项目约束：{json.dumps(project, ensure_ascii=False)}
返修信息：{repair}
必须输出：core_hook,target_audience,identification_entry,core_desire,core_dilemma,long_term_expectation,decision。
scores与evidence对象必须同时包含：core_hook,audience_fit,identification_entry,core_desire,core_dilemma,long_term_expectation,commercial_fit,originality,shootability,signing_potential。
每项0—10分，evidence必须引用创意中的具体事实。decision只能是pass/revise/reject。
若decision为revise，必须额外输出revised_idea：它必须是吸收本轮问题、可直接进入下一轮重新立项的完整创意，而不是修改建议；下一轮将只评估该修订稿。
decision必须按以下硬规则计算，不得凭“仍可完善”自由裁量：十项全部不低于7分时只能为pass；任一项低于7但可修复时为revise；任一项低于4或创意不可修复时为reject。
正文阶段才需展开的人物弧光、情感细节和法律细节不得作为立项阻断项。允许在evidence中提出优化方向，但不能因此把已达到硬门槛的项目标成revise。不得为了通过而虚构素材。"""

    @staticmethod
    def _engine_prompt(idea, assessment, previous, gate) -> str:
        repair = json.dumps({"previous": previous, "gate": gate}, ensure_ascii=False) if gate else "首次设计"
        return f"""你是短剧故事发动机设计师。只输出JSON，不写Markdown。
创意：{idea}
已通过立项：{json.dumps(assessment, ensure_ascii=False)}
返修信息：{repair}
episode_capacity必须30—80。phase_goals至少3项且用episode_start/end无缝覆盖全剧。
opponent_mechanism可为单个对象，或多个对手组成的非空对象数组；每个对象必须含id、pattern、escalation_levels且至少3级。
以下字段必须严格使用指定对象数组结构，不得用points、stages等嵌套结构替代顶层必填字段：
emotional_debts每项含id,debtor,creditor,payoff_episode；
secrets每项含id,holder,audience_knowledge,reveal_episode；
foreshadowing每项含id,setup_episode,payoff_episode；
relationship_curve每项代表一个具体关系状态点，含id,episode,state（同一关系多个状态必须拆成多项）；
payoff_route每项含id,episode,level；
failure_costs每项含id,cost；irreversible_events每项含id,episode,change。
上述所有id全局唯一，所有集数均在1到episode_capacity之间。
伏笔payoff_episode必须晚于setup_episode。输出还必须有long_term_goal。"""
