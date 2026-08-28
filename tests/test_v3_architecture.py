import pytest

from src.context_budget import ContextSelector, TokenBudget, TokenBudgetExceeded, TokenBudgeter
from src.patch_engine import PatchConflict, PatchEngine, StoryPatch
from src.story_state import StoryNode, StoryState
from src.workflow.orchestrator import Orchestrator
from src.expert_protocol import ExpertStateAdapter
from src.experts.base import ExpertOutput
from src.pipeline_orchestrator import LLMAPIAdapter, PipelineOrchestrator
from src.audience_quality import AudienceExperienceTracker
from src.knowledge_retriever import KnowledgeRetriever
from src.token_usage import TokenUsageLedger


def make_state():
    state = StoryState(project={"name": "测试剧", "genre": "悬疑", "raw_material": "原始长素材"}, premise={"mainline": "主角寻找失踪搭档", "protagonist": "林一"})
    state.add_node(StoryNode("E12-S03", "scene", {"conflict": "证据被转移", "secret": "未暴露"}, locked_paths=["secret"]))
    state.add_node(StoryNode("E12-S04", "scene", {"result": "追踪失败"}, depends_on=["E12-S03"]))
    state.add_node(StoryNode("E13-S01", "scene", {"goal": "找到备份"}, depends_on=["E12-S04"]))
    return state


def test_story_state_ids_and_transitive_impact():
    state = make_state()
    assert state.dependents("E12-S03") == ["E12-S04", "E13-S01"]
    with pytest.raises(ValueError):
        state.add_node(StoryNode("E12-S03", "scene"))


def test_patch_is_local_versioned_and_audited():
    state = make_state()
    record = PatchEngine().apply(state, StoryPatch("replace_scene", "E12-S03", {"conflict": "主角公开录音", "secret": "未暴露"}, "增强冲突", expected_version=1))
    assert state.nodes["E12-S03"].version == 2
    assert state.nodes["E12-S04"].data == {"result": "追踪失败"}
    assert record.affected_nodes == ["E12-S04", "E13-S01"]
    assert len(state.changes) == 1


def test_patch_cannot_change_locked_content():
    with pytest.raises(PatchConflict):
        PatchEngine().apply(make_state(), StoryPatch("replace_scene", "E12-S03", {"secret": "幕后人已暴露"}))


def test_context_defaults_to_task_scope_not_raw_material():
    context = ContextSelector().build(make_state(), "patch", ["E12-S03"])
    assert context["level"] == "L1"
    assert "raw_material" not in str(context)
    assert list(context["l1"]["nodes"]) == ["E12-S03"]


def test_l2_retrieves_raw_chunks_without_injecting_full_material():
    state = make_state()
    state.project["raw_material"] = "无关服装资料。\n\n对手转移证据，主角必须付出名誉代价。" * 20
    context = ContextSelector().build(state, "episode", ["E12-S03"], include_raw=True, query="证据和失败代价", raw_token_budget=100)
    assert context["level"] == "L2"
    assert context["l2"]["full_raw_included"] is False
    assert context["l2"]["chunks"]
    assert len(str(context["l2"])) < len(state.project["raw_material"])


def test_budget_preflight_rejects_oversized_context():
    with pytest.raises(TokenBudgetExceeded):
        TokenBudgeter().preflight("sys", "kb", "长" * 100, 10, TokenBudget(context=10, total=100))


def test_budget_preflight_enforces_output_partition():
    with pytest.raises(TokenBudgetExceeded):
        TokenBudgeter().preflight("sys", "kb", "context", 101, TokenBudget(output=100, total=1000))


def test_context_omits_state_field_already_represented_by_selected_node():
    state = make_state()
    state.engine = {"long_term_goal": "重复内容不应再次注入"}
    state.add_node(StoryNode("SYS-ENGINE", "story_engine", {"long_term_goal": "节点版本"}))
    context = ContextSelector().build(state, "episode", ["SYS-ENGINE"], state_fields=("premise", "engine"))
    assert "engine" not in context["l1"]
    assert context["l1"]["nodes"]["SYS-ENGINE"]["long_term_goal"] == "节点版本"


def test_heavy_experts_use_bounded_task_specific_token_profiles():
    structure_budget, structure_output = Orchestrator.EXPERT_TOKEN_PROFILES["§3"]
    episode_budget, episode_output = Orchestrator.EXPERT_TOKEN_PROFILES["§5"]
    outline_review_budget, outline_review_output = Orchestrator.EXPERT_TOKEN_PROFILES["§12"]
    review_budget, review_output = Orchestrator.EXPERT_TOKEN_PROFILES["§16"]
    assert structure_output == 7000
    assert structure_output == structure_budget.output
    assert structure_budget.total == 15000
    assert episode_budget.context >= 16551
    assert episode_output == episode_budget.output
    assert outline_review_budget.context >= 6445
    assert outline_review_output == 2500
    assert outline_review_output == outline_review_budget.output
    assert review_budget.context >= 8092
    assert review_output == review_budget.output
    assert episode_budget.total < 30000
    assert outline_review_budget.total < review_budget.total
    assert review_budget.total < episode_budget.total


def test_orchestrator_checkpoint_contains_v3_state(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§0"], project_path=str(tmp_path))
    orchestrator._init_workflow("主角必须在三天内证明清白")
    assert orchestrator.state.context_snapshot.story_state["schema_version"] == "3.0"


def test_every_workflow_expert_has_a_structured_contract():
    adapter = ExpertStateAdapter()
    for expert_id in Orchestrator.FULL_SEQUENCE:
        contract = adapter.contract(expert_id)
        assert contract.artifact_id.startswith("ART-")
        assert contract.reads


def test_expert_output_is_written_as_versioned_artifact():
    state = make_state()
    adapter = ExpertStateAdapter()
    output = ExpertOutput("quality_auditor", '{"score": 8.2, "issues": []}', validation_passed=True)
    node = adapter.write(state, "§7", output)
    assert node.id == "ART-AUDIT"
    assert node.data["score"] == 8.2
    adapter.write(state, "§7", output)
    assert state.nodes["ART-AUDIT"].version == 2


def test_legacy_pipeline_is_only_a_facade():
    facade = PipelineOrchestrator(LLMAPIAdapter({"platform": "local"}), enable_checkpoint=False)
    assert isinstance(facade._core, Orchestrator)
    assert facade.get_execution_report()["compatibility_facade"] is True


def valid_proposal():
    dimensions = (
        "core_hook", "audience_fit", "identification_entry", "core_desire",
        "core_dilemma", "long_term_expectation", "commercial_fit",
        "originality", "shootability", "signing_potential")
    return {
        "core_hook": "失业律师必须在三天内替仇人翻案",
        "target_audience": "20—35岁悬疑女性观众",
        "identification_entry": "职业受挫与被误解",
        "core_desire": "证明自己的判断没有错",
        "core_dilemma": "救仇人才能救自己",
        "long_term_expectation": "真正栽赃者何时暴露",
        "scores": {key: 8 for key in dimensions},
        "evidence": {key: f"创意中{key}的具体证据" for key in dimensions},
        "decision": "pass",
    }


def valid_engine():
    return {
        "long_term_goal": "找出栽赃集团",
        "phase_goals": [{"id": "PG1", "episode_start": 1, "episode_end": 10, "goal": "拿到卷宗", "outcome": "确认调包"}, {"id": "PG2", "episode_start": 11, "episode_end": 25, "goal": "找到证人", "outcome": "证人倒戈"}, {"id": "PG3", "episode_start": 26, "episode_end": 40, "goal": "公开证据", "outcome": "集团瓦解"}],
        "opponent_mechanism": {"id": "OM1", "pattern": "迫使主角牺牲关系", "escalation_levels": ["资源", "关系", "身份"]},
        "emotional_debts": [{"id": "ED1", "debtor": "主角", "creditor": "父亲", "payoff_episode": 35}],
        "secrets": [{"id": "SEC1", "holder": "证人", "audience_knowledge": "少知道", "reveal_episode": 20}],
        "foreshadowing": [{"id": "F01", "setup_episode": 5, "payoff_episode": 18}],
        "relationship_curve": [{"id": "RC1", "episode": 1, "state": "敌对"}, {"id": "RC2", "episode": 20, "state": "合作"}],
        "payoff_route": [{"id": "PO1", "episode": 10, "level": "小胜"}, {"id": "PO2", "episode": 40, "level": "大胜"}],
        "failure_costs": [{"id": "FC1", "cost": "失去执照"}],
        "irreversible_events": [{"id": "IE1", "episode": 12, "change": "公开伪证"}, {"id": "IE2", "episode": 28, "change": "母亲决裂"}],
        "episode_capacity": 40,
    }


def test_generation_gate_blocks_bulk_writing_before_development(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§11"], project_path=str(tmp_path), enable_culture_kb=False)
    orchestrator._init_workflow("测试创意")
    output = orchestrator.run_step("§11")
    assert output.validation_passed is False
    assert "generation_gate" in output.structured_data
    assert output.structured_data["generation_gate"]["passed"] is False


def test_valid_assessment_and_engine_open_generation_gate(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§11"], project_path=str(tmp_path), enable_culture_kb=False)
    orchestrator._init_workflow("测试创意")
    assert orchestrator.assess_project(valid_proposal())["passed"] is True
    assert orchestrator.configure_story_engine(valid_engine())["passed"] is True
    assert orchestrator.check_generation_gate()["passed"] is True
    state = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    assert "SYS-ASSESSMENT" in state.nodes
    assert "SYS-STORY-ENGINE" in state.nodes


def test_six_curves_require_evidence_and_locate_low_score():
    state = make_state()
    scores = {key: 8 for key in ("identification", "expectation", "conflict", "emotion", "information", "payoff")}
    scores["expectation"] = 4
    evidence = {key: f"{key}的具体文本证据" for key in scores}
    tracker = AudienceExperienceTracker()
    tracker.record(state, 12, "E12-S03", scores, evidence)
    audit = tracker.audit(state)
    issue = next(item for item in audit.issues if item.curve == "expectation")
    assert issue.target_node == "E12-S03"
    assert issue.episode_id == 12
    assert "下一步问题" in issue.diagnosis


def test_diagnosis_drives_versioned_local_patch(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§9"], project_path=str(tmp_path), enable_culture_kb=False)
    orchestrator._init_workflow("测试创意")
    state = make_state()
    orchestrator.state.context_snapshot.story_state = state.to_dict()
    scores = {key: 8 for key in ("identification", "expectation", "conflict", "emotion", "information", "payoff")}
    scores["information"] = 3
    evidence = {key: f"{key}证据" for key in scores}
    orchestrator.record_audience_experience(12, "E12-S03", scores, evidence)
    plan = next(item for item in orchestrator.build_quality_repair_plan() if item["target"] == "E12-S03")
    record = orchestrator.apply_quality_repair(plan["issue_id"], {"conflict": "新证据迫使主角改变策略", "secret": "未暴露"})
    assert record["target"] == "E12-S03"
    repaired = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    assert repaired.nodes["E12-S03"].version == 2
    assert repaired.nodes["E12-S04"].data == {"result": "追踪失败"}


def episode_data(episode_id):
    data = {
        "new_information": f"第{episode_id}集新证据",
        "new_obstacle": f"第{episode_id}集新阻碍",
        "result": f"第{episode_id}集不可逆结果",
        "next_expectation": f"第{episode_id + 1}集具体问题",
        "hook_type": "choice_consequence",
        "locations": 2, "speaking_cast": 3, "night_scenes": 1, "vfx_shots": 0,
    }
    if episode_id == 1:
        data.update({"protagonist_entry": "主角被吊销执照", "core_conflict": "必须替仇人翻案", "long_term_promise": "找出旧案集团"})
    return data


def prepare_signing_ready(orchestrator):
    orchestrator.assess_project(valid_proposal())
    orchestrator.configure_story_engine(valid_engine())
    orchestrator.state.context_snapshot.story_state["project"].update({
        "target_audience": "20—35岁悬疑观众", "content_promise": "每集推进旧案真相", "first_hook_seconds": 5,
    })
    for episode_id in (1, 2, 3):
        orchestrator.upsert_episode(episode_id, episode_data(episode_id))
        scores = {key: 7 + episode_id * 0.5 for key in ("identification", "expectation", "conflict", "emotion", "information", "payoff")}
        evidence = {key: f"第{episode_id}集{key}独立证据" for key in scores}
        signals = {key: f"E{episode_id}-{key}" for key in scores}
        orchestrator.record_audience_experience(episode_id, f"E{episode_id:02}", scores, evidence, signals)


def test_signing_gate_covers_first_three_platform_cost_and_audience(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§15"], project_path=str(tmp_path), enable_culture_kb=False)
    orchestrator._init_workflow("失业律师替仇人翻案")
    prepare_signing_ready(orchestrator)
    verdict = orchestrator.run_signing_audit("douyin", [{"title": "太空喜剧", "text": "宇航员在火星种土豆"}], {"locations": 10, "speaking_cast": 20, "night_scenes": 5, "vfx_shots": 2})
    assert verdict["passed"] is True
    assert verdict["hard_failures"] == []


def test_final_release_is_blocked_without_signing_audit(tmp_path):
    orchestrator = Orchestrator(expert_sequence=["§15"], project_path=str(tmp_path), enable_culture_kb=False)
    orchestrator._init_workflow("测试")
    output = orchestrator.run_step("§15")
    assert output.structured_data["signing_gate"]["passed"] is False


def test_acceptance_requires_observed_usage_even_when_numbers_hit_target():
    orchestrator = Orchestrator(enable_checkpoint=False)
    estimated = orchestrator.run_acceptance_benchmark(10000, 5000, 10000, 1500, "estimated")
    observed = orchestrator.run_acceptance_benchmark(10000, 5000, 10000, 1500, "observed")
    assert estimated["passed"] is False
    assert observed["passed"] is True


def test_knowledge_retrieval_ranks_relevant_chunk_instead_of_prefix():
    document = "# 无关前缀\n古装服饰和礼仪。\n\n# 冲突设计\n对手应针对主角目标提高失败代价并制造不可逆结果。"
    retriever = KnowledgeRetriever(chunk_chars=30, overlap_chars=0)
    chunks = retriever.retrieve(document, "怎样升级主角与对手的冲突和失败代价", 200, lambda text: len(text), top_k=1)
    assert len(chunks) == 1
    assert "失败代价" in chunks[0].text


def test_token_ledger_does_not_mislabel_estimates_as_observed():
    observed = ExpertOutput("a", structured_data={"token_usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15, "evidence": "observed"}})
    estimated = ExpertOutput("b", structured_data={"token_usage": {"prompt_tokens": 20, "completion_tokens": 5, "total_tokens": 25, "evidence": "estimated"}})
    report = TokenUsageLedger().summarize([observed, estimated])
    assert report["evidence"] == "mixed_or_estimated"
    assert report["observed_calls"] == 1


def test_token_ledger_counts_every_retry_and_finish_reason():
    records = [
        {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15, "evidence": "observed", "finish_reason": "length"},
        {"prompt_tokens": 12, "completion_tokens": 3, "total_tokens": 15, "evidence": "observed", "finish_reason": "stop"},
    ]
    report = TokenUsageLedger().summarize_records(records)
    assert report["calls"] == 2
    assert report["total_tokens"] == 30
    assert report["finish_reasons"] == {"length": 1, "stop": 1}
    assert report["truncated_calls"] == 1


@pytest.mark.parametrize("operation,kind", [
    ("update_character", "character"),
    ("update_episode", "episode"),
    ("update_scene", "scene"),
    ("update_foreshadowing", "foreshadowing"),
    ("update_relationship", "relationship"),
])
def test_typed_patch_operations(operation, kind):
    state = StoryState()
    state.add_node(StoryNode("TARGET", kind, {"status": "before", "nested": {"locked": "yes"}}, locked_paths=["nested.locked"]))
    record = PatchEngine().apply(state, StoryPatch(operation, "TARGET", {"status": "after"}, expected_version=1))
    assert record.after["status"] == "after"
    assert state.nodes["TARGET"].data["nested"]["locked"] == "yes"


def test_typed_patch_rejects_wrong_node_kind():
    state = StoryState()
    state.add_node(StoryNode("C01", "character", {"name": "林一"}))
    with pytest.raises(PatchConflict):
        PatchEngine().apply(state, StoryPatch("update_scene", "C01", {"name": "错误"}))
