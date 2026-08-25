from src.audience_quality import CURVES
from src.experts.base import LLMClient
from src.signing_audit import OriginalityAuditor, PlatformFitAuditor
from src.story_state import StoryNode, StoryState
from src.workflow.orchestrator import Orchestrator
from tests.fixtures_v3 import valid_engine, valid_proposal


class SigningLLM(LLMClient):
    def __init__(self, score=8):
        self.score = score
        self.json_calls = 0
        self.text_calls = 0
    def complete_json(self, prompt, **kwargs):
        self.json_calls += 1
        dimensions = ("first3_hook", "mainline_clarity", "protagonist_goal", "episode_progression", "hook_variety", "payoff_sustainability", "audience_fit", "commercial_extension", "shootability")
        return {"scores": {key: self.score for key in dimensions}, "evidence": {key: f"第1—3集{key}的具体行动和结果" for key in dimensions}, "decision": "pass" if self.score >= 7 else "revise"}
    def complete(self, prompt, **kwargs):
        self.text_calls += 1
        return "最终签约评审"


def ready_orchestrator(tmp_path, llm):
    orchestrator = Orchestrator(expert_sequence=["§15"], llm_client=llm, project_path=str(tmp_path), enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("失业律师三天替仇人翻案以证明清白")
    orchestrator.assess_project(valid_proposal())
    orchestrator.configure_story_engine(valid_engine())
    orchestrator.state.context_snapshot.story_state["project"].update({"target_audience": "25—45岁悬疑观众", "content_promise": "每集推进旧案真相", "first_hook_seconds": 5})
    for episode_id in (1, 2, 3):
        data = {"episode_id": episode_id, "new_information": f"E{episode_id}新证据", "new_obstacle": f"E{episode_id}新阻碍", "result": f"E{episode_id}不可逆结果", "next_expectation": f"E{episode_id + 1}具体问题", "hook_type": "choice_consequence", "locations": 2, "speaking_cast": 3, "night_scenes": 1, "vfx_shots": 0}
        if episode_id == 1:
            data.update({"protagonist_entry": "律师执照被冻结", "core_conflict": "救仇人才能救自己", "long_term_promise": "查出旧案操盘者"})
        orchestrator.upsert_episode(episode_id, data)
        scores = {curve: 7 + episode_id * 0.5 for curve in CURVES}
        orchestrator.record_audience_experience(episode_id, f"E{episode_id:02}", scores, {curve: f"E{episode_id}{curve}具体证据" for curve in CURVES}, {curve: f"E{episode_id}-{curve}" for curve in CURVES})
    return orchestrator


def test_originality_cannot_pass_without_source_or_corpus():
    section = OriginalityAuditor().audit(StoryState(), [])
    assert section.passed is False
    assert {item.code for item in section.findings} == {"originality.missing_source", "originality.missing_corpus"}


def test_near_duplicate_premise_is_a_hard_failure():
    state = StoryState(premise={"mainline": "失业律师三天替仇人翻案证明清白"})
    section = OriginalityAuditor().audit(state, [{"title": "重复项目", "text": "失业律师三天替仇人翻案证明清白"}])
    assert section.passed is False
    assert section.findings[0].severity == "blocker"


def test_platform_profile_enforces_per_episode_location_limit():
    state = StoryState(project={"target_audience": "悬疑观众", "content_promise": "查明真相", "first_hook_seconds": 5})
    state.add_node(StoryNode("E01", "episode", {"episode_id": 1, "locations": 9}))
    result = PlatformFitAuditor().audit(state, "douyin")
    assert result.passed is False
    assert any(item.code == "platform.too_many_locations" for item in result.findings)


def test_model_narrative_hard_failure_blocks_release(tmp_path):
    orchestrator = ready_orchestrator(tmp_path, SigningLLM(score=5))
    verdict = orchestrator.auto_run_signing_audit("douyin", [{"title": "太空喜剧", "text": "宇航员种土豆"}], {"locations": 10, "speaking_cast": 20, "night_scenes": 5, "vfx_shots": 2})
    assert verdict["passed"] is False
    assert verdict["release_ready"] is False
    assert "narrative_quality" in verdict["hard_failures"]


def test_story_change_invalidates_previous_release_audit(tmp_path):
    llm = SigningLLM(score=8)
    orchestrator = ready_orchestrator(tmp_path, llm)
    verdict = orchestrator.auto_run_signing_audit("douyin", [{"title": "太空喜剧", "text": "宇航员种土豆"}], {"locations": 10, "speaking_cast": 20, "night_scenes": 5, "vfx_shots": 2})
    assert verdict["release_ready"] is True
    orchestrator.upsert_episode(2, {**orchestrator.state.context_snapshot.story_state["nodes"]["E02"]["data"], "result": "剧情被修改"})
    text_calls = llm.text_calls
    output = orchestrator.run_step("§15")
    assert output.validation_passed is False
    assert output.structured_data["signing_gate"]["fresh"] is False
    assert llm.text_calls == text_calls
