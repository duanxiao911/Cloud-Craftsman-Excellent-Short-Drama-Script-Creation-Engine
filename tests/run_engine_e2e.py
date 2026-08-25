"""Offline end-to-end engine run. No API key or paid model required."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.experts.base import LLMClient
from src.story_state import StoryState
from src.workflow.orchestrator import Orchestrator
from tests.fixtures_v3 import valid_proposal, valid_engine


UNIVERSAL_RESPONSE = """【故事方向确认】
故事方向：失业律师必须在三天内替仇人翻案
一句话前提：救仇人才能证明自己清白
推荐类型：悬疑
核心情感锚点：被误解后的自证
风险评级：🟢绿色
风险项扫描：未发现红线。
项目名称：三日证词
## 核心原则
人物选择推动情节。
## 禁止项
禁止偶遇解决问题。
## 对白差异化
角色词汇不同。
## 平台合规
正向表达。
角色名：林一
面具：冷静律师。驱力：证明清白。弧光：从独行到信任。
角色名：周衡
面具：温和对手。驱力：掩盖旧案。弧光：从控制到失控。
语料库与对白示例：林一：“证据不会替任何人撒谎。” 周衡：“你看到的只是别人允许你看到的。” 证人：“三天后，我可能就不存在了。”
节拍表 段落 弧光
#1 入局 #2 拒绝 #3 选择 #4 受阻 #5 小胜 #6 反噬 #7 真相 #8 决裂 #9 牺牲 #10 新秩序
场景清单：| 1 | 律所 | 内景 | 压抑 | 入局 |
视觉：冷白灯。听觉：复印机停转。嗅觉：潮湿卷宗。触觉：纸张割手。氛围与情绪：压抑转决绝。
格式转换：完成。格式检查：通过。场号1，内景，律所，夜。
6维度评分：人物灵魂8/10，结构节奏8/10，对白质量8/10，情感力度8/10，合规安全9/10，商业潜力8/10。加权总分：8.2。改进建议：加强第二集代价。综合评级：A级。
修改清单：E02加强失败代价。修改后内容：证人撤回证词。修改说明：制造不可逆损失，预期提升期待。
视觉基调：冷色现实主义。光影系统：场景光形成压迫。镜头系统：场景近景追踪选择。声音系统：场景环境音中断。场景光、镜头、景别、场景光、镜头、景别、场景光、镜头、景别、场景光。
市场分析：悬疑题材有明确受众。平台推荐：抖音。变现路径：付费解锁。竞品分析：以人物代价形成差异。
一致性校验：通过。终审结论：可签发。终审评级：A级。✅签发。
执行进度：100%。工作流状态：完成。下一步行动：提交盲审。
"""


class DeterministicLLM(LLMClient):
    def __init__(self):
        self.calls = 0
        self.prompt_chars = 0

    def complete(self, prompt: str, **kwargs) -> str:
        self.calls += 1
        self.prompt_chars += len(prompt)
        return UNIVERSAL_RESPONSE

    def complete_json(self, prompt: str, **kwargs):
        return {"raw": self.complete(prompt, **kwargs)}


def proposal():
    return valid_proposal()


def engine():
    return valid_engine()


def episode(episode_id):
    data = {"new_information": f"新证据{episode_id}", "new_obstacle": f"新阻碍{episode_id}", "result": f"不可逆结果{episode_id}", "next_expectation": f"下一问题{episode_id + 1}", "hook_type": "choice_consequence", "locations": 2, "speaking_cast": 3, "night_scenes": 1, "vfx_shots": 0}
    if episode_id == 1:
        data.update({"protagonist_entry": "被吊销执照", "core_conflict": "替仇人翻案", "long_term_promise": "找出旧案集团"})
    return data


def run(output_path: Path):
    llm = DeterministicLLM()
    experts = list(Orchestrator.FULL_SEQUENCE)
    orchestrator = Orchestrator(expert_sequence=experts, llm_client=llm, enable_checkpoint=False, enable_culture_kb=False)
    orchestrator._init_workflow("失业律师必须在三天内替仇人翻案", project_name="三日证词")
    orchestrator.assess_project(proposal())
    orchestrator.configure_story_engine(engine())
    orchestrator.state.context_snapshot.story_state["project"].update({"target_audience": "20—35岁悬疑观众", "content_promise": "每集推进旧案真相", "first_hook_seconds": 5})
    curves = ("identification", "expectation", "conflict", "emotion", "information", "payoff")
    for episode_id in (1, 2, 3):
        orchestrator.upsert_episode(episode_id, episode(episode_id))
        scores = {curve: 7 + episode_id * 0.5 for curve in curves}
        evidence = {curve: f"E{episode_id}-{curve}-evidence" for curve in curves}
        signals = {curve: f"E{episode_id}-{curve}" for curve in curves}
        orchestrator.record_audience_experience(episode_id, f"E{episode_id:02}", scores, evidence, signals)
    signing = orchestrator.run_signing_audit("douyin", [{"title": "火星农场", "text": "宇航员在火星种土豆"}], {"locations": 10, "speaking_cast": 20, "night_scenes": 5, "vfx_shots": 2})
    results = {}
    for expert_id in experts:
        output = orchestrator.run_step(expert_id)
        results[expert_id] = {"passed": output.validation_passed, "errors": output.validation_errors, "content_chars": len(output.content)}
    state = StoryState.from_dict(orchestrator.state.context_snapshot.story_state)
    report = {"mode": "offline_deterministic", "experts_total": len(experts), "experts_passed": sum(item["passed"] for item in results.values()), "runtime_errors": [key for key, item in results.items() if any("执行错误" in error for error in item["errors"])], "llm_calls": llm.calls, "prompt_chars": llm.prompt_chars, "signing_gate_passed": signing["passed"], "artifacts": sorted(state.nodes), "results": results}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("engine_e2e_report.json")
    print(json.dumps(run(target), ensure_ascii=False, indent=2))
