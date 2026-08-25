"""Observed DeepSeek acceptance for Phase-4 audience audit and local repair."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.story_state import StoryNode, StoryState
from src.workflow.orchestrator import Orchestrator
from tests.run_phase3_acceptance import DeepSeekJSONClient, read_key


def build_state():
    state = StoryState(project={"name": "三日证词", "target_audience": "25—45岁现实悬疑观众"})
    state.add_node(StoryNode("E01", "episode", {
        "episode_id": 1, "goal": "林一必须拿到被封存的旧案卷宗", "choice": "公开自己曾替仇人隐瞒程序错误",
        "cost": "妻子第一次怀疑他的清白", "new_information": "卷宗签收时间晚于受害人死亡",
        "result": "法院永久冻结他的律师权限", "next_expectation": "是谁在死后补签卷宗", "hook_type": "causal_question"}))
    state.add_node(StoryNode("E02", "episode", {
        "episode_id": 2, "goal": "继续调查", "conflict": "遇到阻碍", "choice": "再想办法",
        "cost": "没有明确代价", "new_information": "没有新信息，只重复第一集卷宗异常",
        "result": "局面没有变化", "next_expectation": "以后会怎样", "hook_type": "generic"}, depends_on=["E01"], locked_paths=["episode_id"]))
    state.add_node(StoryNode("E03", "episode", {
        "episode_id": 3, "goal": "在听证前找到补签人", "choice": "把女儿的病历交给记者换取门禁录像",
        "cost": "女儿得知父亲利用自己的隐私并拒绝见他", "new_information": "补签人是林一恩师的已故助理",
        "result": "林一公开录像，迫使恩师承认助理当天不在场", "next_expectation": "恩师为何替不存在的人作证", "hook_type": "choice_consequence"}, depends_on=["E02"]))
    return state


def run(output_path):
    client = DeepSeekJSONClient(read_key())
    orchestrator = Orchestrator(llm_client=client, enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("三天替仇人翻案")
    orchestrator.state.context_snapshot.story_state = build_state().to_dict()
    initial = orchestrator.auto_audit_audience_experience(["E01", "E02", "E03"])
    target_issue = next((item for item in initial["issues"] if item["target_node"] == "E02"), None)
    repair = orchestrator.auto_repair_quality_issue(target_issue["issue_id"]) if target_issue else None
    final = orchestrator.audit_audience_experience()
    state = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    e01_unchanged = state.nodes["E01"].version == 1
    e03_unchanged = state.nodes["E03"].version == 1
    e02_local = state.nodes["E02"].version == 2 and state.nodes["E02"].data.get("episode_id") == 2
    passed = bool(target_issue and repair and final["passed"] and e01_unchanged and e03_unchanged and e02_local)
    report = {
        "status": "passed" if passed else "failed", "evidence": "observed", "model": client.model,
        "initial_audit": initial, "diagnosed_issue": target_issue, "repair": repair, "final_audit": final,
        "locality": {"E01_unchanged": e01_unchanged, "E03_unchanged": e03_unchanged, "E02_version": state.nodes["E02"].version, "locked_episode_id_preserved": state.nodes["E02"].data.get("episode_id") == 2},
        "api_calls": len(client.usages),
        "usage": {"prompt_tokens": sum(x["prompt_tokens"] for x in client.usages), "completion_tokens": sum(x["completion_tokens"] for x in client.usages), "total_tokens": sum(x["total_tokens"] for x in client.usages)},
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("phase4_real_acceptance.json")
    print(json.dumps(run(target), ensure_ascii=False, indent=2))
