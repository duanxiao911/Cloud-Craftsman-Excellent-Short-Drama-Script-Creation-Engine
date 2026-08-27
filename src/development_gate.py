"""Phase-3 project assessment, story engine, and hard generation gate."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List

from src.story_state import StoryState


ASSESSMENT_DIMENSIONS = (
    "core_hook", "audience_fit", "identification_entry", "core_desire",
    "core_dilemma", "long_term_expectation", "commercial_fit",
    "originality", "shootability", "signing_potential",
)

ENGINE_FIELDS = (
    "long_term_goal", "phase_goals", "opponent_mechanism", "emotional_debts",
    "secrets", "foreshadowing", "relationship_curve", "payoff_route",
    "failure_costs", "irreversible_events",
)


@dataclass
class GateIssue:
    code: str
    message: str
    repair: str
    severity: str = "error"


@dataclass
class GateResult:
    passed: bool
    stage: str
    score: float
    issues: List[GateIssue] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {"passed": self.passed, "stage": self.stage, "score": self.score,
                "issues": [asdict(item) for item in self.issues]}


class ProjectEvaluator:
    """Validate a structured commissioning decision; never infers missing scores."""

    PASS_SCORE = 7.0
    CRITICAL_FLOOR = 4.0

    def evaluate(self, proposal: Dict[str, Any]) -> GateResult:
        scores = proposal.get("scores", {})
        evidence = proposal.get("evidence", {})
        issues: List[GateIssue] = []
        valid: List[float] = []
        for key in ASSESSMENT_DIMENSIONS:
            value = scores.get(key)
            if not isinstance(value, (int, float)) or not 0 <= value <= 10:
                issues.append(GateIssue(f"assessment.missing.{key}", f"立项维度 {key} 缺少0—10分评分", "补充证据和量化评分"))
                continue
            valid.append(float(value))
            if not str(evidence.get(key, "")).strip():
                issues.append(GateIssue(f"assessment.evidence.{key}", f"立项维度 {key} 缺少证据", "引用创意中的具体设定、人物欲望或制作条件"))
            if value < self.CRITICAL_FLOOR:
                issues.append(GateIssue(f"assessment.critical.{key}", f"立项维度 {key} 仅 {value} 分", "先重构该维度，不进入大纲扩写"))
        score = round(sum(valid) / len(ASSESSMENT_DIMENSIONS), 2) if len(valid) == len(ASSESSMENT_DIMENSIONS) else 0.0
        required_text = ("core_hook", "target_audience", "identification_entry", "core_desire", "core_dilemma", "long_term_expectation")
        for key in required_text:
            if not str(proposal.get(key, "")).strip():
                issues.append(GateIssue(f"assessment.empty.{key}", f"立项结论缺少 {key}", "用一句可验证的话补齐"))
        if proposal.get("decision") not in {"pass", "revise", "reject"}:
            issues.append(GateIssue("assessment.decision", "立项结论必须是 pass/revise/reject", "根据硬伤和总分给出明确结论"))
        elif proposal.get("decision") != "pass":
            issues.append(GateIssue("assessment.not_passed", f"立项结论为 {proposal.get('decision')}", "先修复创意，再重新评估"))
            if proposal.get("decision") == "revise" and not str(proposal.get("revised_idea", "")).strip():
                issues.append(GateIssue("assessment.missing_revision", "结论为 revise 但未提供 revised_idea", "输出一份可直接重新立项的完整修订创意"))
        if score < self.PASS_SCORE:
            issues.append(GateIssue("assessment.total", f"立项均分 {score} 低于 {self.PASS_SCORE}", "优先修改最低分维度后重新立项"))
        return GateResult(not issues, "project_assessment", score, issues)


class StoryEngineValidator:
    """Check whether the engine has enough mechanisms to sustain serialized drama."""

    PASS_SCORE = 0.8

    def validate(self, engine: Dict[str, Any]) -> GateResult:
        issues: List[GateIssue] = []
        present = 0
        for key in ENGINE_FIELDS:
            value = engine.get(key)
            if value and (not isinstance(value, list) or len(value) > 0):
                present += 1
            else:
                issues.append(GateIssue(f"engine.missing.{key}", f"故事发动机缺少 {key}", "补充可持续升级且能被分集引用的结构化节点"))
        episodes = engine.get("episode_capacity")
        if not isinstance(episodes, int) or not 30 <= episodes <= 80:
            issues.append(GateIssue("engine.episode_capacity", "episode_capacity 必须在30—80集", "按阶段目标重新估算可持续集数"))
        if len(engine.get("phase_goals", [])) < 3:
            issues.append(GateIssue("engine.phase_goals", "阶段性目标少于3个", "至少设计入局、升级、终局三个目标"))
        if len(engine.get("irreversible_events", [])) < 2:
            issues.append(GateIssue("engine.irreversible", "不可逆事件少于2个", "加入会永久改变关系、资源或身份的事件"))
        self._validate_phase_coverage(engine, episodes, issues)
        self._validate_opponent(engine, issues)
        schemas = {
            "emotional_debts": ("id", "debtor", "creditor", "payoff_episode"),
            "secrets": ("id", "holder", "audience_knowledge", "reveal_episode"),
            "foreshadowing": ("id", "setup_episode", "payoff_episode"),
            "relationship_curve": ("id", "episode", "state"),
            "payoff_route": ("id", "episode", "level"),
            "failure_costs": ("id", "cost"),
            "irreversible_events": ("id", "episode", "change"),
        }
        all_ids = set()
        for field_name, required in schemas.items():
            items = engine.get(field_name, [])
            for index, item in enumerate(items):
                if not isinstance(item, dict):
                    issues.append(GateIssue(f"engine.schema.{field_name}.{index}", f"{field_name}[{index}] 必须是结构化对象", "补充唯一ID和必填字段"))
                    continue
                for key in required:
                    if item.get(key) in (None, ""):
                        issues.append(GateIssue(f"engine.schema.{field_name}.{index}.{key}", f"{field_name}[{index}] 缺少 {key}", "补齐可追踪字段"))
                item_id = item.get("id")
                if item_id in all_ids:
                    issues.append(GateIssue("engine.duplicate_id", f"故事发动机ID重复: {item_id}", "为每个机制分配全局唯一ID"))
                if item_id:
                    all_ids.add(item_id)
                for key in ("episode", "setup_episode", "payoff_episode", "reveal_episode"):
                    value = item.get(key)
                    if value is not None and isinstance(episodes, int) and not 1 <= value <= episodes:
                        issues.append(GateIssue(f"engine.episode_range.{item_id}.{key}", f"{item_id} 的 {key} 超出1—{episodes}集", "调整到项目集数范围内"))
                if field_name == "foreshadowing" and item.get("setup_episode", 0) >= item.get("payoff_episode", 0):
                    issues.append(GateIssue(f"engine.foreshadow_order.{item_id}", f"伏笔 {item_id} 的兑现不晚于埋设", "让payoff_episode晚于setup_episode"))
        score = round(present / len(ENGINE_FIELDS), 2)
        if score < self.PASS_SCORE:
            issues.append(GateIssue("engine.coverage", f"发动机完整度 {score:.0%} 低于 {self.PASS_SCORE:.0%}", "补齐缺失机制后再生成正文"))
        return GateResult(not issues, "story_engine", score, issues)

    @staticmethod
    def _validate_phase_coverage(engine: Dict[str, Any], episodes: Any, issues: List[GateIssue]) -> None:
        phases = engine.get("phase_goals", [])
        if not isinstance(episodes, int) or not all(isinstance(item, dict) for item in phases):
            return
        ranges = []
        for index, item in enumerate(phases):
            required = ("id", "episode_start", "episode_end", "goal", "outcome")
            for key in required:
                if item.get(key) in (None, ""):
                    issues.append(GateIssue(f"engine.phase.{index}.{key}", f"phase_goals[{index}] 缺少 {key}", "补齐阶段范围、目标和结果"))
            if isinstance(item.get("episode_start"), int) and isinstance(item.get("episode_end"), int):
                ranges.append((item["episode_start"], item["episode_end"]))
        ranges.sort()
        if ranges and (ranges[0][0] != 1 or ranges[-1][1] != episodes or any(left[1] + 1 != right[0] for left, right in zip(ranges, ranges[1:]))):
            issues.append(GateIssue("engine.phase_coverage", f"阶段范围未无缝覆盖1—{episodes}集: {ranges}", "消除阶段空档和重叠"))

    @staticmethod
    def _validate_opponent(engine: Dict[str, Any], issues: List[GateIssue]) -> None:
        opponent_value = engine.get("opponent_mechanism")
        if isinstance(opponent_value, dict):
            opponents = [opponent_value]
        elif isinstance(opponent_value, list) and opponent_value:
            opponents = opponent_value
        else:
            issues.append(GateIssue("engine.opponent_schema", "opponent_mechanism 必须是结构化对象或非空对象数组", "提供一个或多个含id、pattern和至少三级escalation_levels的对象"))
            return
        for index, opponent in enumerate(opponents):
            if not isinstance(opponent, dict):
                issues.append(GateIssue(f"engine.opponent_schema.{index}", f"opponent_mechanism[{index}] 必须是结构化对象", "提供含id、pattern和至少三级escalation_levels的对象"))
                continue
            if not opponent.get("id") or not opponent.get("pattern"):
                issues.append(GateIssue(f"engine.opponent_fields.{index}", f"对手阻断[{index}]缺少id或pattern", "明确对手如何持续针对主角目标"))
            escalation_levels = opponent.get("escalation_levels")
            if not isinstance(escalation_levels, list) or len(escalation_levels) < 3:
                issues.append(GateIssue(f"engine.opponent_escalation.{index}", f"对手阻断[{index}]升级少于3级", "设计资源、关系、身份逐级升级"))


class GenerationGate:
    def __init__(self):
        self.project_evaluator = ProjectEvaluator()
        self.engine_validator = StoryEngineValidator()

    def check(self, state: StoryState) -> GateResult:
        assessment = self.project_evaluator.evaluate(state.premise.get("assessment", {}))
        engine = self.engine_validator.validate(state.engine)
        issues = assessment.issues + engine.issues
        score = round((assessment.score / 10 + engine.score) / 2, 2)
        return GateResult(not issues, "pre_generation", score, issues)
