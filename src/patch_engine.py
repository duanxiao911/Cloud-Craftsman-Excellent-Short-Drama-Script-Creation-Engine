"""Validated, local StoryState patch operations."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List

from src.story_state import ChangeRecord, StoryState


@dataclass
class StoryPatch:
    operation: str
    target: str
    changes: Dict[str, Any]
    reason: str = ""
    locked_elements: List[str] = field(default_factory=list)
    expected_version: int | None = None


class PatchConflict(ValueError):
    pass


def _get_path(data: Dict[str, Any], path: str) -> Any:
    current: Any = data
    for part in path.split("."):
        current = current[part]
    return current


def _set_path(data: Dict[str, Any], path: str, value: Any) -> None:
    parts = path.split(".")
    current = data
    for part in parts[:-1]:
        nested = current.get(part)
        if not isinstance(nested, dict):
            nested = {}
            current[part] = nested
        current = nested
    current[parts[-1]] = deepcopy(value)


class PatchEngine:
    OPERATION_KINDS = {
        "replace_scene": {"scene"},
        "update_scene": {"scene"},
        "update_character": {"character"},
        "update_episode": {"episode"},
        "update_foreshadowing": {"foreshadowing"},
        "update_relationship": {"relationship"},
        "replace_node": None,
        "update_node": None,
    }
    SUPPORTED = set(OPERATION_KINDS)

    def apply(self, state: StoryState, patch: StoryPatch) -> ChangeRecord:
        if patch.operation not in self.SUPPORTED:
            raise ValueError(f"不支持的 Patch 操作: {patch.operation}")
        if patch.target not in state.nodes:
            raise KeyError(patch.target)
        node = state.nodes[patch.target]
        allowed_kinds = self.OPERATION_KINDS[patch.operation]
        if allowed_kinds is not None and node.kind not in allowed_kinds:
            raise PatchConflict(f"操作 {patch.operation} 不能用于 {node.kind} 节点")
        if patch.expected_version is not None and node.version != patch.expected_version:
            raise PatchConflict(f"版本冲突: expected={patch.expected_version}, actual={node.version}")
        before = deepcopy(node.data)
        protected = sorted(set(node.locked_paths + patch.locked_elements))
        before_locked = {path: deepcopy(_get_path(before, path)) for path in protected}
        after = deepcopy(before)
        if patch.operation.startswith("replace_"):
            after = deepcopy(patch.changes)
        else:
            for path, value in patch.changes.items():
                _set_path(after, path, value)
        for path, value in before_locked.items():
            try:
                if _get_path(after, path) != value:
                    raise PatchConflict(f"Patch 修改了锁定内容: {path}")
            except KeyError as exc:
                raise PatchConflict(f"Patch 删除了锁定内容: {path}") from exc
        affected = state.dependents(patch.target)
        node.data = after
        node.version += 1
        node.updated_at = datetime.now(timezone.utc).isoformat()
        record = ChangeRecord(patch.operation, patch.target, before, deepcopy(after), affected, patch.reason)
        state.changes.append(record)
        return record
