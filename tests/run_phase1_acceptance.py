"""Real-provider V2/V3 token benchmark. Requires OPENAI_API_KEY."""

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.context_budget import ContextSelector, TokenBudgeter
from src.knowledge_retriever import KnowledgeRetriever
from src.story_state import StoryNode, StoryState
from src.patch_engine import PatchEngine, StoryPatch


def call_with_usage(api_key, base_url, model, prompt):
    payload = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 32, "temperature": 0}).encode("utf-8")
    request = urllib.request.Request(base_url.rstrip("/") + "/chat/completions", data=payload, headers={"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"DeepSeek HTTP {error.code}: {detail}") from None
    usage = body.get("usage") or {}
    if not usage.get("total_tokens"):
        raise RuntimeError("供应商响应没有 observed usage")
    return {"prompt_tokens": int(usage.get("prompt_tokens", 0)), "completion_tokens": int(usage.get("completion_tokens", 0)), "total_tokens": int(usage.get("total_tokens", 0)), "evidence": "observed", "model": model}


def run(output_path: Path):
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        key_file = Path(os.getenv("OPENAI_API_KEY_FILE", r"D:\云匠引擎\云匠引擎测试apikey.txt"))
        if key_file.exists():
            api_key = key_file.read_text(encoding="utf-8-sig").strip()
    if not api_key:
        raise RuntimeError("缺少 API Key 环境变量或密钥文件，第一期不能执行真实 Token 验收")
    model = os.getenv("OPENAI_MODEL", "deepseek-chat")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
    raw = ("主角林一被吊销律师执照，必须在三天内替仇人翻案。对手不断转移证据，"
           "每次行动都让主角失去一种关系。") * 180
    state = StoryState(project={"name": "三日证词", "genre": "悬疑", "raw_material": raw}, premise={"mainline": "三天替仇人翻案", "protagonist": "林一"}, engine={"long_term_goal": "找出旧案集团"})
    state.add_node(StoryNode("E01", "episode", {"episode_id": 1, "goal": "拿到卷宗", "conflict": "卷宗被调包"}))
    knowledge = "# 人物\n欲望必须对应代价。\n\n# 冲突\n对手阻断必须针对主角目标并产生不可逆结果。\n\n# 格式\n场景需要内外景和时间标记。" * 35
    query = "设计第一集冲突和失败代价"
    baseline_prompt = "完成任务，只回复OK。\n" + json.dumps(state.to_dict(), ensure_ascii=False) + "\n" + knowledge + "\n" + query
    scoped = ContextSelector().build(state, "episode", ["E01"], include_raw=True, query=query, raw_token_budget=2200)
    chunks = KnowledgeRetriever().retrieve(knowledge, query, 1200, TokenBudgeter.estimate)
    v3_prompt = "完成任务，只回复OK。\n" + json.dumps(scoped, ensure_ascii=False) + "\n" + "\n".join(item.text for item in chunks) + "\n" + query
    baseline = call_with_usage(api_key, base_url, model, baseline_prompt)
    v3 = call_with_usage(api_key, base_url, model, v3_prompt)
    reduction = (baseline["prompt_tokens"] - v3["prompt_tokens"]) / baseline["prompt_tokens"]
    patch_state = StoryState()
    for index in range(1, 11):
        patch_state.add_node(StoryNode(f"E01-S{index:02}", "scene", {"content": (f"场景{index}的动作、对白与因果。" * 20), "locked": "幕后身份不暴露"}, locked_paths=["locked"]))
    total_chars = sum(len(json.dumps(node.data, ensure_ascii=False)) for node in patch_state.nodes.values())
    before_others = {key: json.dumps(node.data, ensure_ascii=False, sort_keys=True) for key, node in patch_state.nodes.items() if key != "E01-S03"}
    change = "主角公开录音，失去女主信任。" * 12
    record = PatchEngine().apply(patch_state, StoryPatch("update_scene", "E01-S03", {"content": change}, expected_version=1))
    regenerated_chars = len(json.dumps(record.after, ensure_ascii=False))
    regeneration_ratio = regenerated_chars / total_chars
    unchanged = all(json.dumps(patch_state.nodes[key].data, ensure_ascii=False, sort_keys=True) == value for key, value in before_others.items())
    token_passed = 0.40 <= reduction <= 0.60
    patch_passed = regeneration_ratio <= 0.20 and unchanged
    report = {"status": "passed" if token_passed and patch_passed else "failed", "evidence": "observed", "model": model, "baseline": baseline, "v3": v3, "prompt_token_reduction": round(reduction, 4), "token_target": {"min": 0.40, "max": 0.60, "passed": token_passed}, "patch": {"regeneration_ratio": round(regeneration_ratio, 4), "target_max": 0.20, "unrelated_nodes_unchanged": unchanged, "passed": patch_passed}}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("phase1_real_token_report.json")
    print(json.dumps(run(target), ensure_ascii=False, indent=2))
