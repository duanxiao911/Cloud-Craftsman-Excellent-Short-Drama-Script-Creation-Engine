"""Native structured-output schemas for the canonical 17 experts."""
from typing import Any, Dict, List

EXPERT_ARTIFACT_SCHEMAS = {
    "§0": ("story_direction", "logline"),
    "§1": ("characters",),
    "§2": ("risk_level", "warnings"),
    "§3": ("beat_table", "arc_tracking"),
    "§4": ("dialogue_corpus",),
    "§5": ("episodes",),
    "§6": ("format_report",),
    "§7": ("scores", "total_score"),
    "§8": ("project_config",),
    "§9": ("revisions",),
    "§10": ("workflow_status",),
    "§11": ("scenes",),
    "§12": ("issues",),
    "§13": ("visual_scheme",),
    "§14": ("business_report",),
    "§15": ("final_verdict",),
    "§16": ("score", "issues", "decision"),
}

def validate_artifact(expert_id: str, artifact: Dict[str, Any]) -> List[str]:
    required = EXPERT_ARTIFACT_SCHEMAS.get(expert_id)
    if not required:
        return [f"未登记专家Schema: {expert_id}"]
    if not isinstance(artifact, dict):
        return ["artifact 必须是对象"]
    return [f"artifact 缺少字段: {key}" for key in required if key not in artifact]
