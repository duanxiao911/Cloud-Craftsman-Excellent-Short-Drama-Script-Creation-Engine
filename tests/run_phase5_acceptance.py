"""Observed DeepSeek end-to-end acceptance for Phase 5."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.story_state import StoryState
from src.workflow.orchestrator import Orchestrator
from tests.run_phase3_acceptance import DeepSeekJSONClient, read_key


EPISODES = {
    1: {"protagonist_entry": "林一在律所门口被公开吊销执照", "core_conflict": "只有替害过自己的陈默翻案才能拿到自证录音", "long_term_promise": "三天内找出旧案操盘者", "new_information": "案卷签收时间晚于受害人死亡", "new_obstacle": "法院封存原始卷宗", "result": "林一公开承认自己曾隐瞒程序错误，永久失去大客户", "next_expectation": "谁在死者死亡后补签卷宗", "hook_type": "choice_consequence", "locations": 3, "speaking_cast": 5, "night_scenes": 1, "vfx_shots": 0},
    2: {"new_information": "补签笔迹来自林一恩师，但门禁显示恩师不在场", "new_obstacle": "恩师申请销毁含笔迹的过期材料", "result": "林一用妻子的记者证截留材料，妻子因此被停职", "next_expectation": "恩师为何替不存在的人留下笔迹", "hook_type": "information_reversal", "locations": 3, "speaking_cast": 5, "night_scenes": 1, "vfx_shots": 0},
    3: {"new_information": "笔迹由陈默模仿，目的是逼真正操盘者调用境外账户", "new_obstacle": "陈默拒绝交代账户，要求林一先撤回对他的旧案指控", "result": "林一撤回指控并遭受害者家属公开决裂，账户却在最后一分钟启动", "next_expectation": "收款人为什么是林一已故父亲", "hook_type": "identity_reversal", "locations": 4, "speaking_cast": 5, "night_scenes": 2, "vfx_shots": 0},
}


def run(output_path):
    client = DeepSeekJSONClient(read_key())
    orchestrator = Orchestrator(expert_sequence=["§15"], llm_client=client, enable_checkpoint=False, enable_culture_kb=False)
    idea = "35岁失业刑辩律师林一被旧案受害者家属指认为伪证帮凶。他只有三天替最恨的前合伙人翻案，才能拿到证明自己清白的原始录音；每推进一步都必须牺牲一段亲密关系，而操盘者能合法转移证据。全剧40集，现代城市实景，主要角色6人，无视效。"
    development = orchestrator.auto_develop_project(idea, {"name": "三日证词", "genre": "现实悬疑", "episode_capacity": 40}, max_attempts=3)
    orchestrator.state.context_snapshot.story_state["project"].update({"target_audience": "25—45岁现实悬疑观众", "content_promise": "每集用有代价的选择推进旧案真相", "first_hook_seconds": 5})
    for episode_id, data in EPISODES.items():
        orchestrator.upsert_episode(episode_id, data)
    audience = orchestrator.auto_audit_audience_experience(["E01", "E02", "E03"])
    corpus = [
        {"title": "重生千金", "text": "豪门千金重生后识破继母阴谋并夺回家产"},
        {"title": "外卖战神", "text": "隐藏身份的高手送外卖时保护女总裁"},
        {"title": "古村喜事", "text": "返乡青年用直播振兴传统手艺和村庄"},
    ]
    verdict = orchestrator.auto_run_signing_audit("douyin", corpus, {"locations": 12, "speaking_cast": 18, "night_scenes": 5, "vfx_shots": 0})
    calls_before_stale_check = len(client.usages)
    changed = dict(orchestrator.state.context_snapshot.story_state["nodes"]["E02"]["data"])
    changed["result"] = "签约后测试性改动"
    orchestrator.upsert_episode(2, changed)
    blocked = orchestrator.run_step("§15")
    stale_no_model_call = len(client.usages) == calls_before_stale_check
    stale_blocked = not blocked.validation_passed and blocked.structured_data.get("signing_gate", {}).get("fresh") is False
    passed = development["passed"] and audience["passed"] and verdict["release_ready"] and stale_blocked and stale_no_model_call
    report = {
        "status": "passed" if passed else "failed", "evidence": "observed", "model": client.model,
        "development": {"passed": development["passed"], "assessment_attempts": development["assessment_attempts"], "engine_attempts": development["engine_attempts"], "assessment": development["assessment"], "assessment_gate": development["assessment_gate"], "engine_gate": development["engine_gate"]},
        "audience": audience, "signing_verdict": verdict,
        "stale_audit_test": {"blocked": stale_blocked, "no_model_call": stale_no_model_call, "reason": blocked.structured_data.get("signing_gate", {}).get("reason")},
        "api_calls": len(client.usages),
        "usage": {"prompt_tokens": sum(x["prompt_tokens"] for x in client.usages), "completion_tokens": sum(x["completion_tokens"] for x in client.usages), "total_tokens": sum(x["total_tokens"] for x in client.usages)},
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("phase5_real_acceptance.json")
    print(json.dumps(run(target), ensure_ascii=False, indent=2))
