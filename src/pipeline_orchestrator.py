"""Historical PipelineOrchestrator API backed by the single V3 core.

This module intentionally contains no scheduler, DAG executor, prompt builder, or
state implementation. All execution is delegated to workflow.Orchestrator.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class ExecutionMode(Enum):
    FULL = "full"
    EPISODE_ONLY = "episode_only"
    SCRIPT_ONLY = "script_only"
    POLISH_ONLY = "polish_only"
    EVALUATE_ONLY = "evaluate_only"


class ExpertStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class ExpertConfig:
    expert_id: str
    name: str
    layer: int
    dependencies: List[str]
    system_prompt_file: str = ""
    input_schema: Optional[Dict] = None
    output_schema: Optional[Dict] = None
    optional: bool = False


@dataclass
class ExpertResult:
    expert_id: str
    status: ExpertStatus
    output: Optional[Dict] = None
    error: Optional[str] = None
    execution_time: float = 0.0
    retry_count: int = 0


class LLMAPIAdapter:
    """Legacy split-prompt adapter retained for source compatibility."""
    def __init__(self, config: Dict):
        self.config = config
        self.platform = config.get("platform", "openai")

    def call(self, system_prompt: str, user_prompt: str, **kwargs) -> str:
        if self.platform != "openai":
            raise NotImplementedError(f"Legacy adapter platform is not implemented: {self.platform}")
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError("请安装 openai 依赖") from exc
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"))
        response = client.chat.completions.create(
            model=self.config.get("model", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            temperature=kwargs.get("temperature", 0.7), max_tokens=kwargs.get("max_tokens", 4000),
        )
        return response.choices[0].message.content


class _LegacyClientAdapter:
    def __init__(self, adapter: LLMAPIAdapter):
        self.adapter = adapter
        self._last_usage = None
    def complete(self, prompt: str, **kwargs) -> str:
        return self.adapter.call("", prompt, **kwargs)
    def complete_json(self, prompt: str, **kwargs) -> Dict:
        text = self.complete(prompt, **kwargs)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw": text}
    def get_last_usage(self):
        return self._last_usage


class PipelineOrchestrator:
    """Compatibility facade. `workflow.Orchestrator` is the only executor."""
    LEGACY_TO_UNIFIED = {
        "commander": "§10", "soul_catcher": "§0", "compliance_guard": "§2",
        "project_configurator": "§8", "character_forger": "§1",
        "structure_architect": "§3", "dialogue_master": "§4",
        "episode_writer": "§5", "episode_outline_reviewer": "§12",
        "scene_craftsman": "§11", "format_craftsman": "§6",
        "quality_auditor": "§7", "revision_editor": "§9",
        "visual_director": "§13", "business_operator": "§14",
        "script_reviewer": "§16", "quality_director": "§15",
    }
    MODE_EXPERTS = {
        ExecutionMode.FULL: list(LEGACY_TO_UNIFIED),
        ExecutionMode.EPISODE_ONLY: ["commander", "soul_catcher", "project_configurator", "character_forger", "structure_architect", "dialogue_master", "episode_writer", "episode_outline_reviewer", "compliance_guard"],
        ExecutionMode.SCRIPT_ONLY: ["compliance_guard", "episode_writer", "scene_craftsman", "format_craftsman", "script_reviewer", "quality_auditor"],
        ExecutionMode.POLISH_ONLY: ["revision_editor", "quality_auditor", "script_reviewer"],
        ExecutionMode.EVALUATE_ONLY: ["episode_outline_reviewer", "script_reviewer", "quality_auditor"],
    }

    def __init__(self, llm_adapter: LLMAPIAdapter, experts_base_path: str = "./knowledge/experts", **kwargs):
        from src.workflow.orchestrator import Orchestrator
        self._core = Orchestrator(expert_sequence=list(self.LEGACY_TO_UNIFIED.values()), llm_client=_LegacyClientAdapter(llm_adapter), knowledge_base_path=experts_base_path, **kwargs)
        self.results: Dict[str, ExpertResult] = {}
        self.experts = {key: ExpertConfig(key, key, index, []) for index, key in enumerate(self.LEGACY_TO_UNIFIED)}

    @property
    def story_state(self) -> Dict:
        if not self._core.state or not self._core.state.context_snapshot:
            return {}
        return self._core.state.context_snapshot.story_state

    def execute(self, project: Dict, mode: ExecutionMode = ExecutionMode.FULL, parallel: bool = True) -> Dict[str, ExpertResult]:
        del parallel
        from src.story_state import StoryState
        selected = self.MODE_EXPERTS[mode]
        sequence = [self.LEGACY_TO_UNIFIED[item] for item in selected]
        self._core.expert_sequence = sequence
        premise = project.get("synopsis") or project.get("story_direction") or project.get("name", "")
        self._core._init_workflow(premise, project_name=project.get("name", ""))
        state = StoryState.from_dict(self._core.state.context_snapshot.story_state)
        state.project.update(project)
        self._core.state.context_snapshot.story_state = state.to_dict()
        self.results = {}
        for legacy_id, unified_id in zip(selected, sequence):
            started = time.time()
            output = self._core.run_step(unified_id, bypass_generation_gate=True, bypass_signing_gate=True)
            status = ExpertStatus.SUCCESS if output.validation_passed else ExpertStatus.FAILED
            self.results[legacy_id] = ExpertResult(legacy_id, status, output.structured_data, None if status is ExpertStatus.SUCCESS else "; ".join(output.validation_errors), time.time() - started)
        return self.results

    def get_execution_report(self) -> Dict:
        return {"orchestrator": "src.workflow.orchestrator.Orchestrator", "compatibility_facade": True, "legacy_gate_bypass": True, "declared_experts": 17, "executed": len(self.results), "successful": sum(item.status is ExpertStatus.SUCCESS for item in self.results.values()), "failed": sum(item.status is ExpertStatus.FAILED for item in self.results.values()), "total_time": sum(item.execution_time for item in self.results.values())}


__all__ = ["ExecutionMode", "ExpertStatus", "ExpertConfig", "ExpertResult", "LLMAPIAdapter", "PipelineOrchestrator"]
