from copy import deepcopy

import pytest

from src.audience_quality import AudienceExperienceTracker, CURVES
from src.experts.base import LLMClient
from src.story_state import StoryNode, StoryState
from src.workflow.orchestrator import Orchestrator


def episode_state():
    state = StoryState(project={"name": "三日证词"})
    state.add_node(StoryNode("E01", "episode", {"episode_id": 1, "goal": "取得卷宗", "result": "妻子开始怀疑"}))
    state.add_node(StoryNode("E02", "episode", {"episode_id": 2, "goal": "寻找证人", "result": "证人倒戈"}, depends_on=["E01"], locked_paths=["result"]))
    return state


def point(node_id, episode_id, score=8, suffix=""):
    return {
        "node_id": node_id,
        "episode_id": episode_id,
        "scores": {curve: score for curve in CURVES},
        "evidence": {curve: f"{node_id}中人物行动与结果-{curve}" for curve in CURVES},
        "signals": {curve: f"{node_id}-{curve}-{suffix}" for curve in CURVES},
    }


class AuditLLM(LLMClient):
    def __init__(self, points):
        self.points = points
        self.calls = []
    def complete(self, prompt, **kwargs):
        raise AssertionError("must use structured JSON")
    def complete_json(self, prompt, **kwargs):
        self.calls.append(prompt)
        return {"points": deepcopy(self.points)}


class RepairAndReauditLLM(LLMClient):
    def complete(self, prompt, **kwargs):
        raise AssertionError("must use structured JSON")
    def complete_json(self, prompt, **kwargs):
        if "局部改稿器" in prompt:
            return {"changes": {"goal": "公开证据迫使证人选边", "new_information": "转账账户属于恩师", "next_expectation": "恩师为何替对手收款"}}
        return {"points": [point("E01", 1, score=8, suffix="fixed")]}


def test_every_episode_requires_all_six_curves_and_issue_ids_are_stable():
    state = episode_state()
    tracker = AudienceExperienceTracker()
    p = point("E01", 1)
    tracker.record(state, 1, "E01", p["scores"], p["evidence"], p["signals"])
    first = tracker.audit(state)
    second = tracker.audit(state)
    assert first.passed is False
    assert {issue.issue_id for issue in first.issues} == {issue.issue_id for issue in second.issues}
    assert {issue.curve for issue in first.issues if issue.episode_id == 2} == set(CURVES)


def test_model_audit_is_node_scoped_and_opens_gate_only_with_complete_coverage(tmp_path):
    llm = AuditLLM([point("E01", 1, suffix="a"), point("E02", 2, suffix="b")])
    orchestrator = Orchestrator(llm_client=llm, project_path=str(tmp_path), enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("三天替仇人翻案")
    orchestrator.state.context_snapshot.story_state = episode_state().to_dict()
    audit = orchestrator.auto_audit_audience_experience(["E01", "E02"])
    assert audit["passed"] is True
    assert len(llm.calls) == 1
    assert "不得创造、改名或遗漏节点" in llm.calls[0]


def test_model_audit_rejects_hallucinated_or_duplicate_nodes(tmp_path):
    llm = AuditLLM([point("E01", 1), point("E99", 2)])
    orchestrator = Orchestrator(llm_client=llm, project_path=str(tmp_path), enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("测试")
    orchestrator.state.context_snapshot.story_state = episode_state().to_dict()
    with pytest.raises(ValueError, match="越界"):
        orchestrator.auto_audit_audience_experience(["E01", "E02"])


def test_local_repair_invalidates_stale_scores_and_requires_reaudit(tmp_path):
    orchestrator = Orchestrator(project_path=str(tmp_path), enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("测试")
    state = episode_state()
    low = point("E01", 1, score=3)
    high = point("E02", 2, score=8, suffix="b")
    tracker = AudienceExperienceTracker()
    tracker.record(state, 1, "E01", low["scores"], low["evidence"], low["signals"])
    tracker.record(state, 2, "E02", high["scores"], high["evidence"], high["signals"])
    orchestrator.state.context_snapshot.story_state = state.to_dict()
    plan = next(item for item in orchestrator.build_quality_repair_plan() if item["target"] == "E01")
    record = orchestrator.apply_quality_repair(plan["issue_id"], {"result": "主角公开卷宗并永久失去客户"})
    assert record["requires_reaudit"] is True
    repaired = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    assert all(not any(p["node_id"] == "E01" for p in points) for points in repaired.audience_curves.values())
    assert AudienceExperienceTracker().audit(repaired).passed is False


def test_automatic_repair_changes_only_diagnosed_node_and_reaudits(tmp_path):
    orchestrator = Orchestrator(llm_client=RepairAndReauditLLM(), project_path=str(tmp_path), enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("测试")
    state = episode_state()
    low = point("E01", 1, score=3)
    high = point("E02", 2, score=8, suffix="b")
    tracker = AudienceExperienceTracker()
    tracker.record(state, 1, "E01", low["scores"], low["evidence"], low["signals"])
    tracker.record(state, 2, "E02", high["scores"], high["evidence"], high["signals"])
    orchestrator.state.context_snapshot.story_state = state.to_dict()
    issue = next(item for item in tracker.audit(state).issues if item.target_node == "E01")
    before_e02 = deepcopy(state.nodes["E02"].data)
    result = orchestrator.auto_repair_quality_issue(issue.issue_id)
    repaired = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    assert result["patch"]["target"] == "E01"
    assert repaired.nodes["E01"].version == 2
    assert repaired.nodes["E02"].data == before_e02
    assert result["reaudit"]["passed"] is True
