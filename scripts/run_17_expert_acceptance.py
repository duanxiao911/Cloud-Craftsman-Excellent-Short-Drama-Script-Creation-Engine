"""Run and diagnose the complete 17-expert/Skill workflow without the browser.

Deterministic mode is free and suitable for state-machine regression. Live mode
uses the configured OpenAI-compatible endpoint and is deliberately guarded by
--allow-paid-api so an accidental invocation cannot spend model credits.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Dict, Optional

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import get_config
from src.experts.base import LLMClient, OpenAIClient
from src.skill_registry import SKILLS, skill_for
from src.workflow.orchestrator import Orchestrator, WorkflowStatus
from tests.run_engine_e2e import engine, episode, proposal


PLANNED_CHECKPOINTS = ("§3", "§11", "§7")
NEXT_CHECKPOINT = {"§3": "§11", "§11": "§7", "§7": None}

EXPERT_MARKERS = {
    "代号⑩实战指挥": "§10", "代号§10实战指挥": "§10", "代号§0灵魂捕手": "§0", "代号§2合规守门员": "§2", "代号§8项目配置师": "§8",
    "代号§1角色铸造师": "§1", "代号§3结构建筑师": "§3", "代号§4对白大师": "§4", "你是分集编剧": "§5",
    "你是集纲审核专家": "§12", "代号⑪场景工匠": "§11", "代号§6格式工匠": "§6", "代号§7质量审计": "§7",
    "代号§9改稿编辑": "§9", "代号§13视觉导演": "§13", "代号⑭商业操盘": "§14", "代号§14商业操盘": "§14", "你是剧本审核专家": "§16",
    "代号⑮品控总监": "§15",
}

DETERMINISTIC_ARTIFACTS = {
    "§10": {"workflow_status": "ready"},
    "§0": {"story_direction": "失业律师三天内替仇人翻案", "logline": "救仇人才能证明自己清白"},
    "§2": {"risk_level": "green", "warnings": []},
    "§8": {"project_config": {"drama_type": "现实悬疑", "total_episodes": 30}},
    "§1": {"characters": [{"name": "林一", "goal": "证明清白", "arc": "从独行到信任"}]},
    "§3": {"beat_table": [{"beat": 1, "event": "被迫接案"}], "arc_tracking": {"林一": "承担代价"}},
    "§4": {"dialogue_corpus": [{"character": "林一", "line": "证据不会替任何人撒谎。"}]},
    "§5": {"episodes": [{"episode_id": 1, "goal": "取得旧案卷宗", "conflict": "执照被吊销", "choice": "替仇人辩护", "cost": "失去同盟", "new_information": "证人仍活着", "result": "拿到线索", "payoffs": [], "new_hook": "证人失踪", "next_expectation": "找到证人"}]},
    "§12": {"summary": "集纲推进有效", "score": 8.2, "issues": []},
    "§11": {"scenes": [{"scene_id": "E01-S01", "location": "旧律所", "action": "林一翻找卷宗"}]},
    "§6": {"format_report": {"passed": True, "scene_count": 1}},
    "§7": {"scores": {"structure": 8, "character": 8, "rhythm": 8, "emotion": 8, "information": 8, "payoff": 8}, "total_score": 8.0},
    "§9": {"revisions": [{"target": "E01", "change": "提高失败代价"}]},
    "§13": {"visual_scheme": {"tone": "冷色现实主义", "camera": "近景追踪选择"}},
    "§14": {"business_report": {"audience": "悬疑用户", "platform": "douyin"}},
    "§16": {"score": 8.4, "issues": [], "strengths": ["因果完整"], "decision": "pass"},
    "§15": {"final_verdict": {"grade": "A", "decision": "approved"}},
}


class AcceptanceFixtureLLM(LLMClient):
    """Schema-valid deterministic responses for all canonical experts."""

    def __init__(self):
        self.calls = 0

    def complete(self, prompt: str, **kwargs) -> str:
        self.calls += 1
        expert_id = next((value for marker, value in EXPERT_MARKERS.items() if marker in prompt), None)
        if not expert_id:
            return json.dumps({"status": "ok"}, ensure_ascii=False)
        return json.dumps(DETERMINISTIC_ARTIFACTS[expert_id], ensure_ascii=False)

    def complete_json(self, prompt: str, **kwargs) -> Dict[str, Any]:
        self.calls += 1
        if "短剧平台签约终审" in prompt:
            dimensions = ("hook", "conflict", "character", "emotion", "information", "payoff")
            return {"scores": {key: 8 for key in dimensions}, "evidence": {key: f"E01-{key}" for key in dimensions}, "decision": "pass"}
        return {"status": "ok"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AcceptanceRecorder:
    def __init__(self, sequence: list[str], timeout_seconds: float):
        self.sequence = sequence
        self.timeout_seconds = timeout_seconds
        self.started: Dict[str, float] = {}
        self.experts: Dict[str, Dict[str, Any]] = {
            expert_id: {
                "order": index + 1,
                "expert_id": expert_id,
                "skill": skill_for(expert_id),
                "attempts": 0,
                "status": "pending",
                "elapsed_seconds": 0.0,
                "content_chars": 0,
                "validation_passed": None,
                "validation_errors": [],
                "quality_gates": [],
                "feedback": [],
            }
            for index, expert_id in enumerate(sequence)
        }
        self.checkpoints: list[Dict[str, Any]] = []
        self.events: list[Dict[str, Any]] = []

    def bind(self, orchestrator: Orchestrator) -> None:
        def on_start(expert_id, step_index, context):
            item = self.experts[expert_id]
            item["attempts"] += 1
            item["status"] = "running"
            self.started[expert_id] = time.monotonic()
            self.events.append({"time": utc_now(), "type": "expert_start", "expert_id": expert_id})

        def on_complete(expert_id, step_index, output):
            item = self.experts[expert_id]
            elapsed = time.monotonic() - self.started.get(expert_id, time.monotonic())
            item["elapsed_seconds"] = round(item["elapsed_seconds"] + elapsed, 3)
            item["content_chars"] = len(output.content or "")
            item["validation_passed"] = bool(output.validation_passed)
            item["validation_errors"] = list(output.validation_errors or [])
            llm_failed = "[LLM调用失败:" in (output.content or "")
            item["status"] = "failed" if llm_failed or not output.validation_passed else "passed"
            item["timeout_exceeded"] = item["elapsed_seconds"] > self.timeout_seconds
            self.events.append({"time": utc_now(), "type": "expert_complete", "expert_id": expert_id, "status": item["status"]})

        def on_error(expert_id, step_index, error):
            item = self.experts[expert_id]
            item["status"] = "error"
            item["runtime_error"] = str(error)
            self.events.append({"time": utc_now(), "type": "expert_error", "expert_id": expert_id, "error": str(error)})

        def on_gate(expert_id, result):
            self.experts[expert_id]["quality_gates"].append(dict(result))
            self.events.append({"time": utc_now(), "type": "quality_gate", "expert_id": expert_id, "passed": result.get("passed", True), "action": result.get("action")})

        def on_checkpoint(expert_id, step_index, state):
            self.checkpoints.append({"time": utc_now(), "expert_id": expert_id, "step_index": step_index, "reason": state.error_message, "decision": "pending"})

        def on_feedback(expert_id, feedback):
            self.experts[expert_id]["feedback"].append(dict(feedback))

        orchestrator.on("on_step_start", on_start)
        orchestrator.on("on_step_complete", on_complete)
        orchestrator.on("on_step_error", on_error)
        orchestrator.on("on_quality_gate", on_gate)
        orchestrator.on("on_checkpoint", on_checkpoint)
        orchestrator.on("on_feedback", on_feedback)


def prepare_deterministic_state(orchestrator: Orchestrator, idea: str) -> None:
    orchestrator._init_workflow(idea, project_name="17专家验收项目")
    orchestrator.assess_project(proposal())
    orchestrator.configure_story_engine(engine())
    state = orchestrator.state.context_snapshot.story_state
    state["project"].update({"target_audience": "20—35岁悬疑观众", "content_promise": "每集推进真相", "first_hook_seconds": 5})
    curves = ("identification", "expectation", "conflict", "emotion", "information", "payoff")
    for episode_id in (1, 2, 3):
        orchestrator.upsert_episode(episode_id, episode(episode_id))
        scores = {curve: (7.0 + episode_id * 0.5 if curve == "conflict" else 8.0) for curve in curves}
        evidence = {curve: f"E{episode_id}-{curve}-evidence" for curve in curves}
        signals = {curve: f"E{episode_id}-{curve}" for curve in curves}
        orchestrator.record_audience_experience(episode_id, f"E{episode_id:02}", scores, evidence, signals)
    orchestrator.run_signing_audit("douyin", [{"title": "火星农场", "text": "宇航员在火星种植粮食"}], {"locations": 8, "speaking_cast": 12, "night_scenes": 3, "vfx_shots": 1})


def next_planned_checkpoint(sequence: list[str], current_expert: str) -> Optional[str]:
    current_index = sequence.index(current_expert)
    return next((item for item in PLANNED_CHECKPOINTS if sequence.index(item) > current_index), None)


def auto_approve_and_resume(orchestrator: Orchestrator, recorder: AcceptanceRecorder):
    state = orchestrator.state
    while state.status == WorkflowStatus.PAUSED:
        current_expert = state.expert_sequence[state.current_step]
        planned = state.error_message == f"human_checkpoint:{current_expert}"
        next_stop = NEXT_CHECKPOINT[current_expert] if planned else next_planned_checkpoint(state.expert_sequence, current_expert)
        if not planned:
            orchestrator.approve_next_gate_result(current_expert)
        if recorder.checkpoints:
            recorder.checkpoints[-1]["decision"] = "auto_confirm" if planned else "auto_override_and_retry"
            recorder.checkpoints[-1]["next_stop"] = next_stop
        state = orchestrator.resume(state.workflow_id, stop_at=next_stop)
    return state


def build_client(mode: str, timeout: float):
    if mode == "deterministic":
        return AcceptanceFixtureLLM(), {"provider": "deterministic", "model": "schema-valid-fixture"}
    config = get_config().llm
    api_key = config.api_key or os.getenv("OPENAI_API_KEY", "")
    if not api_key.strip():
        raise RuntimeError("真实验收缺少API Key：请配置DRAMA_LLM_API_KEY或OPENAI_API_KEY")
    client = OpenAIClient(api_key=api_key, model=config.model, base_url=config.base_url, temperature=config.temperature, timeout=timeout)
    return client, {"provider": config.provider, "model": config.model, "base_url": config.base_url}


def run_acceptance(args) -> Dict[str, Any]:
    if args.mode == "live" and not args.allow_paid_api:
        raise RuntimeError("真实模式会产生模型费用；确认后请添加 --allow-paid-api")
    started = time.monotonic()
    started_at = utc_now()
    client, model_info = build_client(args.mode, args.timeout_per_expert)
    with TemporaryDirectory(prefix="yunjiang-17-acceptance-") as workspace:
        orchestrator = Orchestrator(
            expert_sequence=list(Orchestrator.FULL_SEQUENCE),
            llm_client=client,
            project_path=workspace,
            enable_checkpoint=True,
            enable_culture_kb=args.mode == "live",
            enable_agent_collaboration=True,
        )
        recorder = AcceptanceRecorder(list(orchestrator.expert_sequence), args.timeout_per_expert)
        recorder.bind(orchestrator)
        project_config = {"drama_type": args.drama_type, "total_episodes": args.episodes, "user_materials": "17专家全链路验收"}
        if args.mode == "deterministic":
            prepare_deterministic_state(orchestrator, args.idea)
        else:
            development = orchestrator.auto_develop_project(idea=args.idea, project=project_config, max_attempts=3)
            if not development.get("passed", False):
                raise RuntimeError("立项与故事发动机未通过：" + json.dumps(development, ensure_ascii=False))
        state = orchestrator.run_full(
            args.idea,
            stop_at="§3",
            workflow_id="wf_acceptance_" + datetime.now().strftime("%Y%m%d_%H%M%S"),
            project_config=project_config,
            preserve_state=True,
        )
        state = auto_approve_and_resume(orchestrator, recorder)
        token_usage = orchestrator.get_token_usage_report()

    experts = [recorder.experts[item] for item in Orchestrator.FULL_SEQUENCE]
    failures = [item["expert_id"] for item in experts if item["status"] not in {"passed"}]
    missing_skills = [item["expert_id"] for item in experts if item["skill"]["id"] == "unknown"]
    report = {
        "schema": "yunjiang.17-expert-acceptance",
        "schema_version": "1.0.0",
        "mode": args.mode,
        "started_at": started_at,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "workflow_status": state.status.value,
        "workflow_id": state.workflow_id,
        "model": model_info,
        "summary": {
            "experts_expected": 17,
            "experts_executed": sum(item["attempts"] > 0 for item in experts),
            "experts_passed": sum(item["status"] == "passed" for item in experts),
            "skills_registered": len(SKILLS),
            "skills_executed": sum(item["attempts"] > 0 and item["skill"]["id"] != "unknown" for item in experts),
            "missing_skill_bindings": missing_skills,
            "checkpoints_seen": len(recorder.checkpoints),
            "planned_checkpoints_seen": sum(str(item.get("reason", "")).startswith("human_checkpoint:") for item in recorder.checkpoints),
            "quality_or_signoff_checkpoints": sum(not str(item.get("reason", "")).startswith("human_checkpoint:") for item in recorder.checkpoints),
            "failed_experts": failures,
            "completed": state.status == WorkflowStatus.COMPLETED and not failures and not missing_skills,
        },
        "checkpoints": recorder.checkpoints,
        "experts": experts,
        "token_usage": token_usage,
        "events": recorder.events,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def parse_args():
    parser = argparse.ArgumentParser(description="云匠17专家/Skill全链路验收器")
    parser.add_argument("--mode", choices=("deterministic", "live"), default="deterministic")
    parser.add_argument("--allow-paid-api", action="store_true", help="明确允许真实模型调用产生费用")
    parser.add_argument("--idea", default="失业律师必须在三天内替仇人翻案")
    parser.add_argument("--drama-type", default="现实悬疑")
    parser.add_argument("--episodes", type=int, default=30)
    parser.add_argument("--timeout-per-expert", type=float, default=90.0)
    parser.add_argument("--output", type=Path, default=Path("reports/17_expert_acceptance.json"))
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    try:
        result = run_acceptance(arguments)
        print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
        print(f"REPORT={arguments.output.resolve()}")
        raise SystemExit(0 if result["summary"]["completed"] else 1)
    except Exception as error:
        print(f"ACCEPTANCE_FAILED: {error}", file=sys.stderr)
        raise SystemExit(2)
