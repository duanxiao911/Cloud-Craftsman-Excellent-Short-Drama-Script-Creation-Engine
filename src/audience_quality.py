"""Phase-4 audience experience curves and diagnosis-driven local repair."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import hashlib
import re
from typing import Any, Dict, List, Optional

from src.patch_engine import StoryPatch
from src.story_state import StoryState


CURVES = ("identification", "expectation", "conflict", "emotion", "information", "payoff")


@dataclass
class ExperiencePoint:
    episode_id: int
    node_id: str
    score: float
    evidence: str
    signal: str = ""


@dataclass
class QualityIssue:
    issue_id: str
    curve: str
    episode_id: int
    target_node: str
    diagnosis: str
    evidence: str
    repair: str
    severity: str = "major"
    locked_elements: List[str] = field(default_factory=list)


@dataclass
class AudienceAudit:
    passed: bool
    average: float
    curve_scores: Dict[str, float]
    issues: List[QualityIssue]

    def to_dict(self) -> Dict[str, Any]:
        return {"passed": self.passed, "average": self.average,
                "curve_scores": self.curve_scores,
                "issues": [asdict(issue) for issue in self.issues]}


class AudienceExperienceTracker:
    MIN_SCORE = 6.0

    def record(self, state: StoryState, episode_id: int, node_id: str,
               scores: Dict[str, float], evidence: Dict[str, str],
               signals: Optional[Dict[str, str]] = None) -> None:
        if node_id not in state.nodes:
            raise KeyError(f"体验曲线必须引用已有节点: {node_id}")
        signals = signals or {}
        for curve in CURVES:
            score = scores.get(curve)
            proof = str(evidence.get(curve, "")).strip()
            if not isinstance(score, (int, float)) or not 0 <= score <= 10:
                raise ValueError(f"{curve} 缺少0—10分评分")
            if not proof:
                raise ValueError(f"{curve} 缺少文本证据")
            points = state.audience_curves.setdefault(curve, [])
            points[:] = [p for p in points if not (p.get("episode_id") == episode_id and p.get("node_id") == node_id)]
            points.append(asdict(ExperiencePoint(episode_id, node_id, float(score), proof, signals.get(curve, ""))))
            points.sort(key=lambda p: (p["episode_id"], p["node_id"]))

    def audit(self, state: StoryState) -> AudienceAudit:
        issues: List[QualityIssue] = []
        curve_scores: Dict[str, float] = {}
        expected = self._expected_episode_nodes(state)
        for curve in CURVES:
            points = state.audience_curves.get(curve, [])
            curve_scores[curve] = round(sum(p["score"] for p in points) / len(points), 2) if points else 0.0
            if not points:
                issues.append(QualityIssue(self._issue_id(curve, 0, "", "missing_curve"), curve, 0, "", "缺少整条观众体验曲线", "无逐集证据", "先补逐集评分和证据", "blocker"))
                continue
            for point in points:
                if point["score"] < self.MIN_SCORE:
                    diagnosis, repair = self._diagnose(curve, point)
                    issues.append(QualityIssue(self._issue_id(curve, point["episode_id"], point["node_id"], "low_score"), curve, point["episode_id"], point["node_id"], diagnosis, point["evidence"], repair))
            covered = {int(point["episode_id"]) for point in points}
            for episode_id, node_id in expected.items():
                if episode_id not in covered:
                    issues.append(QualityIssue(self._issue_id(curve, episode_id, node_id, "missing_episode"), curve, episode_id, node_id, "该集缺少观众体验证据", "未记录", "审计该集并补充评分、证据和非空体验信号", "blocker"))
            # Repeated signals expose fake hooks/information repetition even when self-scored highly.
            for previous, current in zip(points, points[1:]):
                if current.get("signal") and current.get("signal") == previous.get("signal"):
                    issues.append(QualityIssue(
                        self._issue_id(curve, current["episode_id"], current["node_id"], "repeated_signal"), curve, current["episode_id"], current["node_id"],
                        f"连续两集重复同一{curve}信号", current["signal"],
                        "改变信息来源、人物选择或结果，避免同构重复", "major",
                    ))
            if curve == "conflict" and len(points) >= 3:
                tail = [p["score"] for p in points[-3:]]
                if tail[0] >= tail[1] >= tail[2]:
                    point = points[-1]
                    issues.append(QualityIssue(self._issue_id(curve, point["episode_id"], point["node_id"], "flat_conflict"), curve, point["episode_id"], point["node_id"], "最近三集冲突没有升级", str(tail), "提高阻断能力或失败代价，并制造不可逆结果"))
        average = round(sum(curve_scores.values()) / len(CURVES), 2)
        blockers = any(issue.severity == "blocker" for issue in issues)
        return AudienceAudit(not blockers and not issues and average >= self.MIN_SCORE, average, curve_scores, issues)

    @staticmethod
    def _issue_id(curve: str, episode_id: int, node_id: str, rule: str) -> str:
        digest = hashlib.sha1(f"{curve}|{episode_id}|{node_id}|{rule}".encode("utf-8")).hexdigest()[:10].upper()
        return f"AQ-{digest}"

    @staticmethod
    def _expected_episode_nodes(state: StoryState) -> Dict[int, str]:
        expected: Dict[int, str] = {}
        for node in sorted(state.nodes.values(), key=lambda item: (item.kind != "episode", item.id)):
            if node.kind not in {"episode", "scene"}:
                continue
            value = node.data.get("episode_id")
            if not isinstance(value, int):
                match = re.match(r"E(\d+)", node.id, re.IGNORECASE)
                value = int(match.group(1)) if match else None
            if isinstance(value, int) and value > 0:
                expected.setdefault(value, node.id)
        return expected

    @staticmethod
    def _diagnose(curve: str, point: Dict[str, Any]) -> tuple[str, str]:
        diagnoses = {
            "identification": ("主角缺少可支持的欲望、代价选择或现实情绪入口", "强化主角当集欲望，让选择付出可见代价"),
            "expectation": ("结尾没有形成具体且可验证的下一步问题", "建立由当集结果自然产生的新问题，避免偶遇式钩子"),
            "conflict": ("阻力没有针对主角目标升级", "增强对手阻断机制，并改变资源、关系或身份状态"),
            "emotion": ("情绪没有递进或释放建立不足", "重排压抑、希望、反转和释放，保留因果过渡"),
            "information": ("本集缺少改变观众判断的新信息", "加入会改变行动策略的新事实，而非复述设定"),
            "payoff": ("先前承诺、伏笔或爽点没有按计划兑现", "兑现已登记承诺，或明确延期代价与新兑现集"),
        }
        return diagnoses[curve]


class DiagnosisRepairPlanner:
    def build(self, state: StoryState, audit: AudienceAudit) -> List[Dict[str, Any]]:
        plans = []
        for issue in audit.issues:
            if not issue.target_node or issue.target_node not in state.nodes:
                continue
            plans.append({
                "issue_id": issue.issue_id,
                "operation": "update_node",
                "target": issue.target_node,
                "reason": f"{issue.diagnosis}；{issue.repair}",
                "locked_elements": list(state.nodes[issue.target_node].locked_paths),
                "affected_nodes": state.dependents(issue.target_node),
                "expected_version": state.nodes[issue.target_node].version,
            })
        return plans

    @staticmethod
    def to_patch(plan: Dict[str, Any], changes: Dict[str, Any]) -> StoryPatch:
        return StoryPatch(plan["operation"], plan["target"], changes, plan["reason"], plan["locked_elements"], plan["expected_version"])
