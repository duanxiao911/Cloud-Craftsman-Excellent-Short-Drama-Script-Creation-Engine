"""Structured production exports for downstream video-generation adapters."""

from copy import deepcopy
from datetime import datetime, timezone
import re
from typing import Any, Dict, Iterable, List, Optional

from src.experts.base import ExpertOutput
from src.story_state import StoryNode, StoryState


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_list(value: Any) -> List[Dict[str, Any]]:
    if isinstance(value, list):
        return [dict(item) if isinstance(item, dict) else {"content": str(item)} for item in value]
    return []


class ProductionExportService:
    SCHEMA_VERSION = "1.0.0"
    TARGETS = ("generic", "xiaoyunque", "dramaclaw")

    def __init__(self, state: StoryState, outputs: Optional[Dict[str, ExpertOutput]] = None):
        self.state = state
        self.outputs = outputs or {}

    def _artifact(self, node_id: str) -> Dict[str, Any]:
        node = self.state.nodes.get(node_id)
        if not node:
            return {}
        artifact = node.data.get("artifact")
        return dict(artifact) if isinstance(artifact, dict) else dict(node.data)

    def characters(self) -> List[Dict[str, Any]]:
        artifact = self._artifact("ART-CHARACTERS")
        values = _as_list(artifact.get("characters"))
        if not values:
            values = [dict(node.data) for node in self.state.nodes.values() if node.kind == "character"]
        result = []
        for index, item in enumerate(values, 1):
            result.append({
                "id": str(item.get("id") or item.get("character_id") or f"CHAR-{index:03}"),
                "name": str(item.get("name") or item.get("角色名") or f"角色{index}"),
                "role": item.get("role") or item.get("定位") or "",
                "appearance": item.get("appearance") or item.get("外形") or "",
                "personality": item.get("personality") or item.get("性格") or "",
                "motivation": item.get("motivation") or item.get("desire") or item.get("欲望") or "",
                "voice": item.get("voice") or item.get("speech_style") or item.get("声纹") or "",
                "arc": item.get("arc") or item.get("弧光") or "",
                "source": deepcopy(item),
            })
        return result

    def scenes(self) -> List[Dict[str, Any]]:
        artifact = self._artifact("ART-SCENES")
        values = _as_list(artifact.get("scenes"))
        if not values:
            values = [dict(node.data, id=node.id) for node in self.state.nodes.values() if node.kind == "scene"]
        result = []
        for index, item in enumerate(values, 1):
            scene_id = str(item.get("id") or item.get("scene_id") or item.get("source_id") or f"E01-S{index:02}")
            episode_match = re.search(r"E(\d+)", scene_id, re.I)
            result.append({
                "id": scene_id,
                "episode": int(item.get("episode") or item.get("episode_id") or (episode_match.group(1) if episode_match else 1)),
                "order": int(item.get("order") or item.get("scene_num") or index),
                "location": item.get("location") or item.get("scene") or item.get("场景") or "",
                "time": item.get("time") or item.get("时间") or "",
                "interior_exterior": item.get("interior_exterior") or item.get("内外景") or "",
                "characters": list(item.get("characters") or item.get("人物") or []),
                "goal": item.get("goal") or item.get("目标") or "",
                "conflict": item.get("conflict") or item.get("冲突") or "",
                "action": item.get("action") or item.get("动作") or "",
                "dialogue": item.get("dialogue") or item.get("dialogues") or item.get("对白") or [],
                "result": item.get("result") or item.get("结果") or "",
                "visual": item.get("visual") or item.get("visual_prompt") or item.get("视觉") or "",
                "source": deepcopy(item),
            })
        return result

    def storyboard(self, scenes: Optional[Iterable[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        scene_list = list(scenes or self.scenes())
        shots = []
        for scene in scene_list:
            source = scene.get("source", {})
            candidates = source.get("shots") or source.get("storyboard") or source.get("beats") or []
            if not isinstance(candidates, list) or not candidates:
                candidates = [{
                    "visual": scene.get("visual") or scene.get("action") or scene.get("conflict"),
                    "audio": scene.get("dialogue"),
                    "shot_size": "中景",
                }]
            for index, item in enumerate(candidates, 1):
                if not isinstance(item, dict):
                    item = {"visual": str(item)}
                shots.append({
                    "id": str(item.get("id") or f"{scene['id']}-SHOT-{index:02}"),
                    "scene_id": scene["id"],
                    "episode": scene["episode"],
                    "order": index,
                    "shot_size": item.get("shot_size") or item.get("景别") or "中景",
                    "camera": item.get("camera") or item.get("镜头") or "固定",
                    "duration_seconds": item.get("duration_seconds") or item.get("时长") or None,
                    "visual_prompt": item.get("visual") or item.get("visual_prompt") or "",
                    "audio_prompt": item.get("audio") or item.get("audio_prompt") or "",
                    "dialogue": item.get("dialogue") or "",
                })
        return shots

    def build(self, workflow_id: str, target: str = "generic") -> Dict[str, Any]:
        if target not in self.TARGETS:
            raise ValueError(f"不支持的下游目标: {target}")
        characters = self.characters()
        scenes = self.scenes()
        storyboard = self.storyboard(scenes)
        base = {
            "schema": "yunjiang.drama.production",
            "schema_version": self.SCHEMA_VERSION,
            "workflow_id": workflow_id,
            "generated_at": _now(),
            "target": target,
            "project": {
                "name": self.state.project.get("name", ""),
                "premise": self.state.premise.get("mainline", ""),
                "story_schema_version": self.state.schema_version,
            },
            "characters": characters,
            "scenes": scenes,
            "storyboard": storyboard,
            "counts": {"characters": len(characters), "scenes": len(scenes), "shots": len(storyboard)},
        }
        return self._adapt(base, target)

    @staticmethod
    def _adapt(base: Dict[str, Any], target: str) -> Dict[str, Any]:
        if target == "generic":
            return base
        if target == "xiaoyunque":
            return {
                "contract": "yunjiang.adapter.xiaoyunque.v1",
                "source": {key: base[key] for key in ("workflow_id", "schema", "schema_version")},
                "project": base["project"],
                "role_cards": base["characters"],
                "scene_prompts": base["scenes"],
                "shot_list": base["storyboard"],
                "counts": base["counts"],
            }
        return {
            "contract": "yunjiang.adapter.dramaclaw.v1",
            "source": {key: base[key] for key in ("workflow_id", "schema", "schema_version")},
            "series": base["project"],
            "entities": {"characters": base["characters"]},
            "timeline": {"scenes": base["scenes"], "shots": base["storyboard"]},
            "counts": base["counts"],
        }

