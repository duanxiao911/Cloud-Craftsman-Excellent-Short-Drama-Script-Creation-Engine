import inspect
import json
from pathlib import Path

from src.artifact_schema import EXPERT_ARTIFACT_SCHEMAS
from src.expert_protocol import CONTRACTS
from src.experts.base import ExpertBase, ExpertContext, ExpertRegistry, LLMClient
from src.story_state import StoryState
from src.workflow.orchestrator import Orchestrator
from src.pipeline_orchestrator import PipelineOrchestrator, ExecutionMode
from tests.fixtures_v3 import valid_proposal, valid_engine


ARTIFACTS = {
    "§0": {"story_direction": "三天替仇人翻案", "logline": "救仇人才能救自己"},
    "§1": {"characters": [{"id": "C01", "name": "林一"}]},
    "§2": {"risk_level": "green", "warnings": []},
    "§3": {"beat_table": [{"id": "B01"}], "arc_tracking": []},
    "§4": {"dialogue_corpus": {"C01": ["证据不会撒谎"]}},
    "§5": {"episodes": [{"episode_id": 1, "goal": "拿卷宗", "conflict": "被调包", "choice": "公开录音", "cost": "失去信任", "new_information": "旧案相关", "result": "被停职", "payoffs": [], "new_hook": "证人来电", "next_expectation": "证人是谁"}]},
    "§6": {"format_report": {"valid": True}},
    "§7": {"scores": {"story": 8}, "total_score": 8.0},
    "§8": {"project_config": {"episodes": 40}},
    "§9": {"revisions": [{"target": "E01-S01"}]},
    "§10": {"workflow_status": {"status": "running", "next": "ideation"}},
    "§11": {"scenes": [{"id": "E01-S01", "goal": "拿卷宗"}]},
    "§12": {"issues": [], "score": 8.0},
    "§13": {"visual_scheme": {"tone": "冷白"}},
    "§14": {"business_report": {"platform": "douyin"}},
    "§15": {"final_verdict": {"decision": "approved", "grade": "A"}},
    "§16": {"score": 82, "issues": [], "decision": "pass"},
}


class QueueLLM(LLMClient):
    def __init__(self, sequence):
        self.responses = [json.dumps(ARTIFACTS[item], ensure_ascii=False) for item in sequence]
    def complete(self, prompt, **kwargs):
        return self.responses.pop(0)
    def complete_json(self, prompt, **kwargs):
        return json.loads(self.complete(prompt, **kwargs))


class FinishReasonLLM(LLMClient):
    def __init__(self, response, finish_reason):
        self.response = response
        self.finish_reason = finish_reason
    def complete(self, prompt, **kwargs):
        return self.response
    def complete_json(self, prompt, **kwargs):
        return json.loads(self.complete(prompt, **kwargs))
    def get_last_finish_reason(self):
        return self.finish_reason


def proposal():
    return valid_proposal()


def engine():
    return valid_engine()


def prepare(orchestrator):
    orchestrator._init_workflow("三天替仇人翻案")
    orchestrator.assess_project(proposal())
    orchestrator.configure_story_engine(engine())
    orchestrator.state.context_snapshot.story_state["project"].update({"target_audience": "悬疑观众", "content_promise": "每集新证据", "first_hook_seconds": 5})
    curves = ("identification", "expectation", "conflict", "emotion", "information", "payoff")
    for episode_id in (1, 2, 3):
        data = {"new_information": f"证据{episode_id}", "new_obstacle": f"阻碍{episode_id}", "result": f"结果{episode_id}", "next_expectation": f"问题{episode_id + 1}", "hook_type": "choice_consequence", "locations": 1, "speaking_cast": 2, "night_scenes": 0, "vfx_shots": 0}
        if episode_id == 1:
            data.update({"protagonist_entry": "停职", "core_conflict": "替仇人翻案", "long_term_promise": "找集团"})
        orchestrator.upsert_episode(episode_id, data)
        scores = {curve: 7 + episode_id * 0.5 for curve in curves}
        orchestrator.record_audience_experience(episode_id, f"E{episode_id:02}", scores, {curve: f"E{episode_id}-{curve}" for curve in curves}, {curve: f"S{episode_id}-{curve}" for curve in curves})
    assert orchestrator.run_signing_audit("douyin", [{"title": "太空喜剧", "text": "宇航员在火星种土豆"}], {"locations": 10, "speaking_cast": 10, "night_scenes": 2, "vfx_shots": 1})["passed"]


def test_canonical_roster_has_17_real_experts_and_schemas():
    assert len(Orchestrator.FULL_SEQUENCE) == 17
    assert len(set(Orchestrator.FULL_SEQUENCE)) == 17
    assert set(Orchestrator.FULL_SEQUENCE) == set(EXPERT_ARTIFACT_SCHEMAS) == set(CONTRACTS)
    for expert_id in Orchestrator.FULL_SEQUENCE:
        expert_class = ExpertRegistry.get(expert_id)
        assert expert_class and issubclass(expert_class, ExpertBase)


def test_finish_reason_length_is_a_hard_validation_failure():
    response = json.dumps(ARTIFACTS["§5"], ensure_ascii=False)
    expert = ExpertRegistry.create_instance("§5", llm_client=FinishReasonLLM(response, "length"))
    output = expert.execute(ExpertContext(task_context={"test": True}))
    assert output.validation_passed is False
    assert output.structured_data["generation"]["truncated"] is True
    assert any("Token上限截断" in error for error in output.validation_errors)


def test_malformed_native_json_cannot_pass_through_fallback_parser():
    expert = ExpertRegistry.create_instance("§5", llm_client=FinishReasonLLM('{"episodes":[', "stop"))
    output = expert.execute(ExpertContext(task_context={"test": True}))
    assert output.validation_passed is False
    assert any("JSON输出不完整或无效" in error for error in output.validation_errors)


def test_pipeline_module_contains_no_second_executor():
    import src.pipeline_orchestrator as module
    source = inspect.getsource(module)
    assert "ThreadPoolExecutor" not in source
    assert "_LegacyDAGImplementation" not in source
    assert "def _execute_expert" not in source
    assert source.count("class PipelineOrchestrator") == 1


def test_all_17_experts_write_native_versioned_artifacts():
    sequence = Orchestrator.FULL_SEQUENCE
    orchestrator = Orchestrator(expert_sequence=sequence, llm_client=QueueLLM(sequence), enable_checkpoint=False, enable_culture_kb=False)
    prepare(orchestrator)
    for expert_id in sequence:
        output = orchestrator.run_step(expert_id, bypass_signing_gate=True) if expert_id == "§15" else orchestrator.run_step(expert_id)
        assert output.validation_passed, (expert_id, output.validation_errors)
        assert output.structured_data["artifact_schema_valid"] is True
        assert output.structured_data["expert_id"] == expert_id
    state = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    artifact_ids = {CONTRACTS[item].artifact_id for item in sequence}
    assert artifact_ids <= set(state.nodes)
    assert len(artifact_ids) == 17


class QueueLegacyAdapter:
    def __init__(self, sequence):
        self.responses = [json.dumps(ARTIFACTS[item], ensure_ascii=False) for item in sequence]
    def call(self, system_prompt, user_prompt, **kwargs):
        return self.responses.pop(0)


def test_legacy_full_api_migrates_all_17_calls_to_single_core():
    sequence = Orchestrator.FULL_SEQUENCE
    facade = PipelineOrchestrator(QueueLegacyAdapter(sequence), enable_checkpoint=False, enable_culture_kb=False)
    results = facade.execute({"name": "三日证词", "synopsis": "三天替仇人翻案"}, ExecutionMode.FULL)
    report = facade.get_execution_report()
    assert len(results) == 17
    assert report["executed"] == 17
    assert report["successful"] == 17
    assert report["orchestrator"] == "src.workflow.orchestrator.Orchestrator"
