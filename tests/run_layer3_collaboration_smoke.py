"""第三层三层 Agent 协作的无模型验收脚本。"""

import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import MethodType

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.experts.base import ExpertOutput
from src.workflow.orchestrator import Orchestrator, WorkflowStatus


def verify_targeted_retry() -> None:
    with TemporaryDirectory() as workspace:
        engine = Orchestrator(
            expert_sequence=["§0"],
            project_path=workspace,
            enable_culture_kb=False,
            enable_agent_collaboration=True,
        )
        attempts = []

        def fake_execute(self, step_index, context, **kwargs):
            attempts.append(dict(kwargs))
            passed = len(attempts) > 1
            return ExpertOutput(
                expert_name="§0",
                content="repaired" if passed else "invalid",
                validation_passed=passed,
                validation_errors=[] if passed else ["缺少核心欲望"],
            )

        engine._execute_step = MethodType(fake_execute, engine)
        engine._check_quality_gate = MethodType(lambda self, expert_id, output: {"passed": True}, engine)
        state = engine.run_full("校园甜宠创意")
        assert state.status == WorkflowStatus.COMPLETED
        assert len(attempts) == 2
        assert "collaboration_feedback" in attempts[1]
        assert any(event["type"] == "feedback_dispatch" for event in engine.collaboration.events)


def verify_audit_repair_reaudit() -> None:
    with TemporaryDirectory() as workspace:
        engine = Orchestrator(
            expert_sequence=["§7", "§9", "§15"],
            project_path=workspace,
            enable_culture_kb=False,
            enable_agent_collaboration=True,
        )
        calls = []
        audit_runs = {"count": 0}

        def fake_execute(self, step_index, context, **kwargs):
            expert_id = self.expert_sequence[step_index]
            calls.append(expert_id)
            return ExpertOutput(expert_name=expert_id, content=f"ok-{expert_id}", validation_passed=True)

        def fake_gate(self, expert_id, output):
            if expert_id == "§7":
                audit_runs["count"] += 1
                if audit_runs["count"] == 1:
                    return {"passed": False, "action": "loop_to_§9", "reason": "节奏证据不足"}
            return {"passed": True}

        engine._execute_step = MethodType(fake_execute, engine)
        engine._check_quality_gate = MethodType(fake_gate, engine)
        state = engine.run_full("男频爽文创意", project_config={"drama_type": "男频爽文"})
        assert state.status == WorkflowStatus.COMPLETED
        assert calls == ["§7", "§9", "§7", "§15"], calls
        assert engine.get_progress()["revision_count"] == 1
        assert engine.collaboration.plan is not None
        assert engine.collaboration.plan.story_type == "男频爽文"


def verify_escalation_checkpoint() -> None:
    with TemporaryDirectory() as workspace:
        engine = Orchestrator(
            expert_sequence=["§0"],
            project_path=workspace,
            enable_culture_kb=False,
            enable_agent_collaboration=True,
            max_targeted_retries=1,
        )

        def always_invalid(self, step_index, context, **kwargs):
            return ExpertOutput(
                expert_name="§0",
                content="invalid",
                validation_passed=False,
                validation_errors=["核心创意仍不完整"],
            )

        engine._execute_step = MethodType(always_invalid, engine)
        state = engine.run_full("待完善创意")
        assert state.status == WorkflowStatus.PAUSED
        assert state.completed_steps == []
        assert "返工次数已耗尽" in state.error_message


if __name__ == "__main__":
    verify_targeted_retry()
    verify_audit_repair_reaudit()
    verify_escalation_checkpoint()
    print("LAYER3_COLLABORATION_SMOKE_OK: decision -> execution -> supervision -> targeted repair -> re-audit")
