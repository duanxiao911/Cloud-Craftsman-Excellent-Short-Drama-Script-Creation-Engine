"""V3 structured story state and dependency index."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Set


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class StoryNode:
    id: str
    kind: str
    data: Dict[str, Any] = field(default_factory=dict)
    depends_on: List[str] = field(default_factory=list)
    locked_paths: List[str] = field(default_factory=list)
    version: int = 1
    updated_at: str = field(default_factory=_now)


@dataclass
class ChangeRecord:
    operation: str
    target: str
    before: Dict[str, Any]
    after: Dict[str, Any]
    affected_nodes: List[str]
    reason: str = ""
    created_at: str = field(default_factory=_now)


@dataclass
class StoryState:
    project: Dict[str, Any] = field(default_factory=dict)
    premise: Dict[str, Any] = field(default_factory=dict)
    engine: Dict[str, Any] = field(default_factory=dict)
    audience_curves: Dict[str, List[Any]] = field(default_factory=lambda: {
        key: [] for key in ("identification", "expectation", "conflict", "emotion", "information", "payoff")
    })
    nodes: Dict[str, StoryNode] = field(default_factory=dict)
    changes: List[ChangeRecord] = field(default_factory=list)
    schema_version: str = "3.0"

    NODE_KINDS = {
        "project_assessment", "story_engine", "character", "relationship",
        "episode", "scene", "foreshadowing", "audience_audit",
        "acceptance_benchmark", "signing_audit", "expert_artifact",
        "premise_assessment", "compliance_report", "project_config",
        "character_set", "dialogue_design", "story_structure", "scene_design",
        "formatted_script", "quality_audit", "revision_proposal", "visual_design",
        "business_report", "final_verdict",
        "episode_plan", "outline_review", "script_review", "workflow_strategy",
    }

    def add_node(self, node: StoryNode) -> None:
        if not node.id or node.id in self.nodes:
            raise ValueError(f"故事节点 ID 缺失或重复: {node.id}")
        if node.kind not in self.NODE_KINDS:
            raise ValueError(f"未知故事节点类型: {node.kind}")
        missing = [dep for dep in node.depends_on if dep not in self.nodes]
        if missing:
            raise ValueError(f"节点 {node.id} 引用了不存在的依赖: {missing}")
        self.nodes[node.id] = node

    def dependents(self, node_id: str, transitive: bool = True) -> List[str]:
        if node_id not in self.nodes:
            raise KeyError(node_id)
        found: Set[str] = set()
        frontier = [node_id]
        while frontier:
            current = frontier.pop(0)
            direct = sorted(n.id for n in self.nodes.values() if current in n.depends_on)
            for item in direct:
                if item not in found:
                    found.add(item)
                    if transitive:
                        frontier.append(item)
        return sorted(found)

    def select(self, ids: Iterable[str]) -> Dict[str, Dict[str, Any]]:
        return {node_id: asdict(self.nodes[node_id]) for node_id in ids if node_id in self.nodes}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "project": deepcopy(self.project),
            "premise": deepcopy(self.premise),
            "engine": deepcopy(self.engine),
            "audience_curves": deepcopy(self.audience_curves),
            "nodes": {key: asdict(value) for key, value in self.nodes.items()},
            "changes": [asdict(change) for change in self.changes],
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StoryState":
        state = cls(
            project=data.get("project", {}), premise=data.get("premise", {}),
            engine=data.get("engine", {}), audience_curves=data.get("audience_curves", {}),
            schema_version=data.get("schema_version", "3.0"),
        )
        state.nodes = {key: StoryNode(**value) for key, value in data.get("nodes", {}).items()}
        state.changes = [ChangeRecord(**value) for value in data.get("changes", [])]
        return state
