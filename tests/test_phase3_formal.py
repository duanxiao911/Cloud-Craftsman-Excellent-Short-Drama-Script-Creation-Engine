from copy import deepcopy

from src.development_gate import ProjectEvaluator, StoryEngineValidator
from src.experts.base import LLMClient
from src.workflow.orchestrator import Orchestrator
from src.development_service import ProjectDevelopmentService
from tests.fixtures_v3 import valid_engine, valid_proposal


class RepairingDevelopmentLLM(LLMClient):
    def __init__(self):
        invalid_assessment = valid_proposal()
        invalid_assessment["evidence"] = {}
        invalid_assessment["decision"] = "revise"
        invalid_assessment["revised_idea"] = "三天替仇人翻案，并以公开名誉为不可逆代价"
        invalid_engine = valid_engine()
        invalid_engine["phase_goals"][1]["episode_start"] = 15
        invalid_engine["opponent_mechanism"]["escalation_levels"] = ["资源"]
        self.assessments = [invalid_assessment, valid_proposal()]
        self.engines = [invalid_engine, valid_engine()]
        self.calls = []
    def complete(self, prompt, **kwargs):
        raise AssertionError("development service must request JSON")
    def complete_json(self, prompt, **kwargs):
        self.calls.append(prompt)
        if "立项委员会" in prompt:
            return deepcopy(self.assessments.pop(0))
        return deepcopy(self.engines.pop(0))


class RejectingDevelopmentLLM(LLMClient):
    def __init__(self):
        self.calls = 0
    def complete(self, prompt, **kwargs):
        self.calls += 1
        raise AssertionError("body model must not be called")
    def complete_json(self, prompt, **kwargs):
        self.calls += 1
        proposal = valid_proposal()
        proposal["decision"] = "reject"
        proposal["scores"] = {key: 2 for key in proposal["scores"]}
        return proposal


def test_project_assessment_requires_evidence_and_explicit_pass():
    proposal = valid_proposal()
    proposal["evidence"].pop("core_hook")
    proposal["decision"] = "revise"
    result = ProjectEvaluator().evaluate(proposal)
    codes = {item.code for item in result.issues}
    assert result.passed is False
    assert "assessment.evidence.core_hook" in codes
    assert "assessment.not_passed" in codes


def test_assessment_decision_is_deterministic_and_preserves_model_opinion():
    proposal = valid_proposal()
    proposal["decision"] = "revise"
    ProjectDevelopmentService._normalize_assessment_decision(proposal)
    assert proposal["decision"] == "pass"
    assert proposal["model_decision"] == "revise"
    assert "min_dimension" in proposal["decision_policy_applied"]


def test_story_engine_requires_ids_coverage_escalation_and_payoff_order():
    engine = valid_engine()
    engine["phase_goals"][1]["episode_start"] = 14
    engine["opponent_mechanism"]["escalation_levels"] = ["资源"]
    engine["foreshadowing"][0]["payoff_episode"] = 4
    engine["secrets"][0]["id"] = engine["emotional_debts"][0]["id"]
    result = StoryEngineValidator().validate(engine)
    codes = {item.code for item in result.issues}
    assert "engine.phase_coverage" in codes
    assert "engine.opponent_escalation.0" in codes
    assert any(code.startswith("engine.foreshadow_order") for code in codes)
    assert "engine.duplicate_id" in codes


def test_story_engine_accepts_multiple_structured_opponents():
    engine = valid_engine()
    first = deepcopy(engine["opponent_mechanism"])
    second = {
        "id": "OM2",
        "pattern": "利用制度持续封锁主角的证据链",
        "escalation_levels": [
            {"level": 1, "episode": 5, "description": "封锁卷宗"},
            {"level": 2, "episode": 15, "description": "威胁证人"},
            {"level": 3, "episode": 25, "description": "构陷主角"},
        ],
    }
    engine["opponent_mechanism"] = [first, second]
    result = StoryEngineValidator().validate(engine)
    assert result.passed is True


def test_story_engine_rejects_invalid_item_in_opponent_array():
    engine = valid_engine()
    engine["opponent_mechanism"] = [engine["opponent_mechanism"], "invalid"]
    result = StoryEngineValidator().validate(engine)
    codes = {item.code for item in result.issues}
    assert "engine.opponent_schema.1" in codes


def test_auto_development_repairs_assessment_and_engine_before_persisting():
    llm = RepairingDevelopmentLLM()
    orchestrator = Orchestrator(llm_client=llm, enable_checkpoint=False, enable_culture_kb=False)
    result = orchestrator.auto_develop_project("三天替仇人翻案", {"name": "三日证词"}, max_attempts=3)
    assert result["passed"] is True
    assert result["assessment_attempts"] == 2
    assert result["engine_attempts"] == 2
    assert len(llm.calls) == 4
    assert orchestrator.check_generation_gate()["passed"] is True


def test_rejected_idea_never_reaches_engine_or_body_generation():
    llm = RejectingDevelopmentLLM()
    orchestrator = Orchestrator(expert_sequence=["§11"], llm_client=llm, enable_checkpoint=False, enable_culture_kb=False)
    result = orchestrator.auto_develop_project("没有目标也没有冲突的创意", max_attempts=3)
    assert result["passed"] is False
    assert result["engine"] is None
    calls_after_assessment = llm.calls
    output = orchestrator.run_step("§11")
    assert "generation_gate" in output.structured_data
    assert llm.calls == calls_after_assessment


def test_full_workflow_pauses_at_first_body_step_when_gate_fails(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§11", "§6"], project_path=str(tmp_path), enable_culture_kb=False)
    state = orchestrator.run_full("未评估创意")
    assert state.status.value == "paused"
    assert state.completed_steps == []
    assert "§6" not in state.step_outputs
