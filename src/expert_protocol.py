"""Uniform StoryState read/write contract for every expert."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from src.experts.base import ExpertOutput
from src.story_state import StoryNode, StoryState


@dataclass(frozen=True)
class ExpertContract:
    task: str
    reads: tuple[str, ...]
    artifact_kind: str
    artifact_id: str


CONTRACTS: Dict[str, ExpertContract] = {
    "§0": ExpertContract("ideation", ("premise",), "premise_assessment", "ART-PREMISE"),
    "§2": ExpertContract("ideation", ("premise",), "compliance_report", "ART-COMPLIANCE"),
    "§8": ExpertContract("ideation", ("premise",), "project_config", "ART-PROJECT"),
    "§1": ExpertContract("outline", ("premise", "engine"), "character_set", "ART-CHARACTERS"),
    "§4": ExpertContract("outline", ("premise", "engine", "character"), "dialogue_design", "ART-DIALOGUE"),
    "§3": ExpertContract("outline", ("premise", "engine", "character"), "story_structure", "ART-STRUCTURE"),
    "§5": ExpertContract("episode", ("story_structure", "character_set", "dialogue_design", "story_engine"), "episode_plan", "ART-EPISODES"),
    "§11": ExpertContract("scene", ("episode", "scene", "character"), "scene_design", "ART-SCENES"),
    "§12": ExpertContract("audit", ("episode_plan", "episode"), "outline_review", "ART-OUTLINE-REVIEW"),
    "§6": ExpertContract("scene", ("episode", "scene"), "formatted_script", "ART-SCRIPT"),
    "§7": ExpertContract("audit", ("episode", "scene", "audience_curve"), "quality_audit", "ART-AUDIT"),
    "§9": ExpertContract("patch", ("scene", "quality_audit"), "revision_proposal", "ART-REVISION"),
    "§13": ExpertContract("scene", ("scene",), "visual_design", "ART-VISUAL"),
    "§14": ExpertContract("audit", ("premise", "episode"), "business_report", "ART-BUSINESS"),
    "§15": ExpertContract("audit", ("quality_audit", "business_report"), "final_verdict", "ART-VERDICT"),
    "§16": ExpertContract("audit", ("formatted_script", "scene", "quality_audit"), "script_review", "ART-SCRIPT-REVIEW"),
    "§10": ExpertContract("audit", ("project_assessment", "premise"), "workflow_strategy", "ART-COMMAND"),
}


def parse_structured(content: str) -> Dict[str, Any]:
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    candidate = fenced.group(1) if fenced else content.strip()
    try:
        value = json.loads(candidate)
        return value if isinstance(value, dict) else {"items": value}
    except (json.JSONDecodeError, TypeError):
        return {"raw": content}


class ExpertStateAdapter:
    """Projects only declared node kinds and persists one versioned artifact."""

    def contract(self, expert_id: str) -> ExpertContract:
        return CONTRACTS.get(expert_id, ExpertContract("audit", ("premise",), "expert_artifact", f"ART-{expert_id}"))

    def node_ids_for(self, state: StoryState, expert_id: str, requested: Optional[Iterable[str]] = None) -> List[str]:
        contract = self.contract(expert_id)
        requested_set = set(requested or [])
        ids = []
        for node in state.nodes.values():
            if node.id.startswith("ART-"):
                allowed = node.kind in contract.reads
            else:
                allowed = node.kind in contract.reads
            if allowed and (not requested_set or node.id in requested_set):
                ids.append(node.id)
        return sorted(ids)

    def write(self, state: StoryState, expert_id: str, output: ExpertOutput) -> StoryNode:
        contract = self.contract(expert_id)
        payload = dict(output.structured_data)
        parsed = parse_structured(output.content)
        payload.update({key: value for key, value in parsed.items() if key not in payload})
        payload.update({"expert_id": expert_id, "validation_passed": output.validation_passed})
        dependencies = self.node_ids_for(state, expert_id)
        existing = state.nodes.get(contract.artifact_id)
        if existing:
            existing.data = payload
            existing.depends_on = dependencies
            existing.version += 1
            return existing
        node = StoryNode(contract.artifact_id, contract.artifact_kind, payload, dependencies)
        state.add_node(node)
        return node
