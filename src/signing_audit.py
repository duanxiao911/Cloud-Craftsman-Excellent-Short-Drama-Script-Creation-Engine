"""Phase-5 commissioning audit: first-three, originality, platform, and cost."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Iterable, List, Optional

from src.story_state import StoryState


@dataclass
class AuditFinding:
    code: str
    message: str
    location: str
    repair: str
    severity: str = "error"


@dataclass
class AuditSection:
    name: str
    passed: bool
    score: float
    findings: List[AuditFinding] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {"name": self.name, "passed": self.passed, "score": self.score,
                "findings": [asdict(item) for item in self.findings]}


@dataclass
class SigningVerdict:
    passed: bool
    score: float
    sections: Dict[str, AuditSection]
    hard_failures: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {"passed": self.passed, "score": self.score,
                "sections": {key: section.to_dict() for key, section in self.sections.items()},
                "hard_failures": self.hard_failures}


class FirstThreeEpisodesAuditor:
    REQUIRED = ("protagonist_entry", "core_conflict", "long_term_promise")
    EPISODE_REQUIRED = ("new_information", "new_obstacle", "result", "next_expectation")
    OVERUSED_HOOKS = {"slap", "eavesdrop", "accidental_encounter", "打脸", "偷听", "撞见"}

    def audit(self, state: StoryState) -> AuditSection:
        episodes = {int(n.data.get("episode_id", -1)): n for n in state.nodes.values() if n.kind == "episode"}
        findings: List[AuditFinding] = []
        for episode_id in (1, 2, 3):
            node = episodes.get(episode_id)
            if not node:
                findings.append(AuditFinding("first3.missing_episode", f"缺少第{episode_id}集结构", f"E{episode_id:02}", "先完成结构化集纲", "blocker"))
                continue
            required = self.EPISODE_REQUIRED + (self.REQUIRED if episode_id == 1 else ())
            for key in required:
                if not node.data.get(key):
                    findings.append(AuditFinding(f"first3.missing.{key}", f"第{episode_id}集缺少 {key}", node.id, "补充具体事件而非抽象描述"))
            if node.data.get("hook_type") in self.OVERUSED_HOOKS:
                findings.append(AuditFinding("first3.overused_hook", f"第{episode_id}集仅使用高频同构钩子", node.id, "改为选择后果、信息翻转或关系不可逆变化"))
        score = round(max(0.0, 100 - len(findings) * 12.5), 1)
        return AuditSection("first_three_episodes", not findings, score, findings)


class OriginalityAuditor:
    @staticmethod
    def _ngrams(text: str, size: int = 3) -> set[str]:
        normalized = "".join(text.lower().split())
        return {normalized[i:i + size] for i in range(max(0, len(normalized) - size + 1))}

    def audit(self, state: StoryState, corpus: Iterable[Dict[str, str]], threshold: float = 0.72) -> AuditSection:
        source = " ".join(str(state.premise.get(key, "")) for key in ("mainline", "logline", "core_hook"))
        source_set = self._ngrams(source)
        findings = []
        corpus = list(corpus)
        if not source_set:
            findings.append(AuditFinding("originality.missing_source", "缺少可用于同质化检测的主线、logline或核心卖点", "premise", "先保存明确的一句话主线", "blocker"))
        if not corpus:
            findings.append(AuditFinding("originality.missing_corpus", "同质化语料库为空", "corpus", "提供已发布或内部候选项目语料", "blocker"))
        maximum = 0.0
        for item in corpus:
            target_set = self._ngrams(item.get("text", ""))
            union = source_set | target_set
            similarity = len(source_set & target_set) / len(union) if union else 0.0
            maximum = max(maximum, similarity)
            if similarity >= threshold:
                findings.append(AuditFinding("originality.similar", f"与样本《{item.get('title', '未命名')}》结构文本相似度 {similarity:.0%}", "premise", "重构人物欲望、阻断机制或核心代价", "blocker"))
        return AuditSection("originality", not findings, round((1 - maximum) * 100, 1), findings)


class PlatformFitAuditor:
    """Configurable editorial profile; these defaults are internal, not platform policy."""

    DEFAULT_PROFILES = {
        "douyin": {"max_first_hook_seconds": 8, "max_locations_per_episode": 4, "required": ("target_audience", "content_promise")},
        "kuaishou": {"max_first_hook_seconds": 10, "max_locations_per_episode": 4, "required": ("target_audience", "emotional_anchor")},
        "hongguo": {"max_first_hook_seconds": 15, "max_locations_per_episode": 5, "required": ("target_audience", "long_term_promise")},
    }

    def audit(self, state: StoryState, platform: str, profile: Optional[Dict[str, Any]] = None) -> AuditSection:
        selected = profile or self.DEFAULT_PROFILES.get(platform)
        if not selected:
            finding = AuditFinding("platform.unknown", f"未配置平台 {platform}", "project.platform", "提供平台审美与制作约束配置", "blocker")
            return AuditSection("platform_fit", False, 0, [finding])
        findings = []
        project = state.project
        for key in selected.get("required", ()):
            if not project.get(key) and not state.premise.get(key):
                findings.append(AuditFinding(f"platform.missing.{key}", f"平台适配缺少 {key}", "project", "补充明确受众承诺"))
        hook_seconds = project.get("first_hook_seconds")
        if not isinstance(hook_seconds, (int, float)) or hook_seconds > selected["max_first_hook_seconds"]:
            findings.append(AuditFinding("platform.late_hook", "首个有效钩子出现过晚或未标注", "E01", f"在{selected['max_first_hook_seconds']}秒内建立欲望、阻碍或信息差"))
        max_locations = selected.get("max_locations_per_episode")
        if isinstance(max_locations, int):
            for node in state.nodes.values():
                if node.kind == "episode" and int(node.data.get("locations", 0)) > max_locations:
                    findings.append(AuditFinding("platform.too_many_locations", f"{node.id} 单集场景数超过平台编辑档案上限 {max_locations}", node.id, "合并或复用场景"))
        return AuditSection("platform_fit", not findings, round(max(0, 100 - len(findings) * 25), 1), findings)


class ProductionCostAuditor:
    def audit(self, state: StoryState, limits: Dict[str, int]) -> AuditSection:
        episodes = [n for n in state.nodes.values() if n.kind == "episode"]
        totals = {key: sum(int(n.data.get(key, 0)) for n in episodes) for key in ("locations", "speaking_cast", "night_scenes", "vfx_shots")}
        findings = []
        for key, limit in limits.items():
            if totals.get(key, 0) > limit:
                findings.append(AuditFinding(f"cost.exceeded.{key}", f"{key}={totals[key]} 超过预算上限 {limit}", "episodes", "合并场景、角色或改用可复用实景"))
        return AuditSection("production_cost", not findings, round(max(0, 100 - len(findings) * 25), 1), findings)


class SigningGate:
    PASS_SCORE = 80.0

    def audit(self, state: StoryState, platform: str, corpus: Iterable[Dict[str, str]],
              cost_limits: Dict[str, int], platform_profile: Optional[Dict[str, Any]] = None) -> SigningVerdict:
        sections = {
            "first_three": FirstThreeEpisodesAuditor().audit(state),
            "originality": OriginalityAuditor().audit(state, corpus),
            "platform": PlatformFitAuditor().audit(state, platform, platform_profile),
            "cost": ProductionCostAuditor().audit(state, cost_limits),
        }
        score = round(sum(item.score for item in sections.values()) / len(sections), 1)
        hard = [key for key, item in sections.items() if not item.passed]
        return SigningVerdict(not hard and score >= self.PASS_SCORE, score, sections, hard)


class NarrativeQualityAuditor:
    """Validate model evidence for story appeal; deterministic code owns the gate."""

    DIMENSIONS = ("first3_hook", "mainline_clarity", "protagonist_goal", "episode_progression", "hook_variety", "payoff_sustainability", "audience_fit", "commercial_extension", "shootability")
    MIN_SCORE = 7.0

    def audit(self, assessment: Dict[str, Any]) -> AuditSection:
        scores = assessment.get("scores", {})
        evidence = assessment.get("evidence", {})
        findings: List[AuditFinding] = []
        valid = []
        for key in self.DIMENSIONS:
            value = scores.get(key)
            if not isinstance(value, (int, float)) or not 0 <= value <= 10:
                findings.append(AuditFinding(f"narrative.missing.{key}", f"签约质量维度 {key} 缺少评分", "first3", "补充0—10分和具体证据"))
                continue
            valid.append(float(value))
            if not str(evidence.get(key, "")).strip():
                findings.append(AuditFinding(f"narrative.evidence.{key}", f"签约质量维度 {key} 缺少文本证据", "first3", "引用具体人物行动、信息或结果"))
            if value < self.MIN_SCORE:
                findings.append(AuditFinding(f"narrative.low.{key}", f"签约质量维度 {key} 仅 {value} 分", "first3", "定位对应集和病因后局部修复", "blocker"))
        if assessment.get("decision") != "pass":
            findings.append(AuditFinding("narrative.decision", "模型签约结论未通过", "first3", "先修复低分维度再重新审计", "blocker"))
        score = round(sum(valid) / len(self.DIMENSIONS) * 10, 1) if len(valid) == len(self.DIMENSIONS) else 0.0
        return AuditSection("narrative_quality", not findings and score >= 70, score, findings)
