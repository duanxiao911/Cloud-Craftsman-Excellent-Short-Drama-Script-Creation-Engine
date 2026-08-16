"""Three-layer Agent collaboration primitives.

The coordinator is deliberately model-independent: the decision layer produces a
traceable execution contract, the execution layer reports expert artifacts, and
the supervision layer returns deterministic, targeted feedback directives.  The
orchestrator remains responsible for actually invoking experts and checkpoints.
"""

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from src.experts.base import ExpertOutput


PHASE_BY_EXPERT = {
    "§10": "strategy",
    "§0": "strategy",
    "§2": "strategy",
    "§8": "strategy",
    "§1": "characters",
    "§3": "structure",
    "§4": "characters",
    "§5": "structure",
    "§12": "structure_review",
    "§11": "production",
    "§6": "production",
    "§7": "quality",
    "§9": "repair",
    "§13": "production",
    "§14": "market",
    "§16": "quality",
    "§15": "release",
}

DEPENDENCIES = {
    "§0": ["§10"],
    "§2": ["§0"],
    "§8": ["§0", "§2"],
    "§1": ["§8"],
    "§3": ["§1"],
    "§4": ["§1"],
    "§5": ["§3", "§4"],
    "§12": ["§5"],
    "§11": ["§12"],
    "§6": ["§11"],
    "§7": ["§6"],
    "§9": ["§7"],
    "§13": ["§6"],
    "§14": ["§7"],
    "§16": ["§7", "§13"],
    "§15": ["§14", "§16"],
}


@dataclass
class CollaborationTask:
    expert_id: str
    phase: str
    objective: str
    dependencies: List[str] = field(default_factory=list)
    supervisor: str = "监督层 Agent"
    priority: int = 50


@dataclass
class CollaborationPlan:
    plan_id: str
    story_type: str
    selected_experts: List[str]
    tasks: List[CollaborationTask]
    rationale: List[str]
    created_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            "tasks": [asdict(task) for task in self.tasks],
        }


@dataclass
class SupervisionVerdict:
    expert_id: str
    passed: bool
    action: str
    reason: str
    responsible_expert: Optional[str] = None
    retry: int = 0
    evidence: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class CollaborationCoordinator:
    """Deterministic decision/execution/supervision coordinator."""

    def __init__(self, max_targeted_retries: int = 2):
        self.max_targeted_retries = max_targeted_retries
        self.plan: Optional[CollaborationPlan] = None
        self.events: List[Dict[str, Any]] = []
        self.retry_counts: Dict[str, int] = {}

    def build_plan(
        self,
        story_direction: str,
        project_config: Dict[str, Any],
        expert_sequence: List[str],
        descriptions: Dict[str, str],
    ) -> CollaborationPlan:
        story_type = str(project_config.get("drama_type") or "通用短剧")
        lowered = f"{story_type} {story_direction}".lower()
        priorities: Dict[str, int] = {}
        rationale = ["保留完整17专家闭环，按产物依赖分阶段协作"]
        if any(word in lowered for word in ("非遗", "文化", "heritage")):
            priorities.update({"§2": 95, "§11": 92, "§13": 90})
            rationale.append("文化题材提高合规、场景工艺与视觉证据优先级")
        if any(word in lowered for word in ("男频", "爽", "male")):
            priorities.update({"§3": 94, "§5": 92, "§7": 90})
            rationale.append("男频题材提高结构、分集钩子与爽点审计优先级")
        if any(word in lowered for word in ("校园", "甜宠", "campus")):
            priorities.update({"§1": 94, "§4": 92, "§2": 90})
            rationale.append("校园甜宠提高人物关系、对白语感与校园合规优先级")

        selected = list(dict.fromkeys(expert_sequence))
        selected_set = set(selected)
        tasks = []
        for expert_id in selected:
            desc = descriptions.get(expert_id, expert_id)
            objective = desc.split("：", 1)[-1]
            tasks.append(CollaborationTask(
                expert_id=expert_id,
                phase=PHASE_BY_EXPERT.get(expert_id, "execution"),
                objective=objective,
                dependencies=[dep for dep in DEPENDENCIES.get(expert_id, []) if dep in selected_set],
                priority=priorities.get(expert_id, 70 if expert_id in {"§7", "§15", "§16"} else 50),
            ))
        now = datetime.now().isoformat()
        self.plan = CollaborationPlan(
            plan_id=f"plan_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            story_type=story_type,
            selected_experts=selected,
            tasks=tasks,
            rationale=rationale,
            created_at=now,
        )
        self.record("decision_plan", layer="decision", plan=self.plan.to_dict())
        return self.plan

    def record(self, event_type: str, **payload: Any) -> Dict[str, Any]:
        event = {
            "event_id": len(self.events) + 1,
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            **payload,
        }
        self.events.append(event)
        return event

    def supervise_output(self, expert_id: str, output: ExpertOutput) -> SupervisionVerdict:
        if output.validation_passed:
            verdict = SupervisionVerdict(
                expert_id=expert_id,
                passed=True,
                action="accept",
                reason="产物结构校验通过",
                evidence={"content_length": len(output.content), "structured_keys": sorted(output.structured_data)},
            )
        else:
            retry = self.retry_counts.get(expert_id, 0)
            if retry < self.max_targeted_retries:
                retry += 1
                self.retry_counts[expert_id] = retry
                verdict = SupervisionVerdict(
                    expert_id=expert_id,
                    passed=False,
                    action="retry_responsible_expert",
                    reason="专家产物未通过自身结构校验，定向返工",
                    responsible_expert=expert_id,
                    retry=retry,
                    evidence={"validation_errors": list(output.validation_errors)},
                )
            else:
                verdict = SupervisionVerdict(
                    expert_id=expert_id,
                    passed=False,
                    action="escalate",
                    reason="定向返工次数已耗尽，升级为人工检查点",
                    responsible_expert=expert_id,
                    retry=retry,
                    evidence={"validation_errors": list(output.validation_errors)},
                )
        self.record("supervision_verdict", layer="supervision", verdict=verdict.to_dict())
        return verdict

    def supervise_gate(self, expert_id: str, gate_result: Dict[str, Any]) -> SupervisionVerdict:
        passed = gate_result.get("passed", True)
        action = gate_result.get("action", "accept") if not passed else "accept"
        responsible = "§9" if action == "loop_to_§9" else expert_id if not passed else None
        verdict = SupervisionVerdict(
            expert_id=expert_id,
            passed=passed,
            action=action,
            reason=gate_result.get("reason", "质量门禁通过"),
            responsible_expert=responsible,
            retry=self.retry_counts.get(responsible or expert_id, 0),
            evidence={"gate": gate_result},
        )
        self.record("gate_verdict", layer="supervision", verdict=verdict.to_dict())
        return verdict

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan": self.plan.to_dict() if self.plan else None,
            "events": list(self.events),
            "retry_counts": dict(self.retry_counts),
            "max_targeted_retries": self.max_targeted_retries,
        }

    def restore(self, payload: Optional[Dict[str, Any]]) -> None:
        if not payload:
            return
        raw_plan = payload.get("plan")
        if raw_plan:
            self.plan = CollaborationPlan(
                plan_id=raw_plan["plan_id"],
                story_type=raw_plan.get("story_type", "通用短剧"),
                selected_experts=list(raw_plan.get("selected_experts", [])),
                tasks=[CollaborationTask(**task) for task in raw_plan.get("tasks", [])],
                rationale=list(raw_plan.get("rationale", [])),
                created_at=raw_plan.get("created_at", ""),
            )
        self.events = list(payload.get("events", []))
        self.retry_counts = {str(key): int(value) for key, value in payload.get("retry_counts", {}).items()}
