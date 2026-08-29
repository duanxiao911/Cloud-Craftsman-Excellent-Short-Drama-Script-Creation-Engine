"""v5 前后端接入的无模型烟测：验证三个人工检查点可连续暂停与恢复。"""

import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import MethodType

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.experts.base import ExpertOutput
from src.workflow.orchestrator import Orchestrator, WorkflowStatus


def main() -> None:
    frontend_source = (PROJECT_ROOT / "frontend" / "yunjiang-feature-upgrade.js").read_text(encoding="utf-8")
    assert 'expertId==="§11"&&Array.isArray(data.scenes)' in frontend_source
    assert 'return "# 场景设计方案' in frontend_source
    assert 'expertId==="§16"&&Array.isArray(data.issues)' in frontend_source
    assert 'return "# 剧本审核报告' in frontend_source
    assert 'loadFullExpertOutput(event.expert_id)' in frontend_source
    assert 'event.output||event.output_preview' not in frontend_source

    api_source = (PROJECT_ROOT / "src" / "api" / "server.py").read_text(encoding="utf-8")
    assert 'output=output.content,' in api_source
    assert '"content": output.content if output.content else ""' in api_source

    with TemporaryDirectory() as workspace:
        orchestrator = Orchestrator(
            use_full_sequence=True,
            enable_checkpoint=True,
            project_path=workspace,
        )

        def fake_execute(self, step_index, context, **kwargs):
            expert_id = self.expert_sequence[step_index]
            self._trigger_callback("on_step_start", expert_id, step_index, context)
            output = ExpertOutput(
                expert_name=expert_id,
                content=f"output-{expert_id}",
                validation_passed=True,
            )
            self._trigger_callback("on_step_complete", expert_id, step_index, output)
            return output

        orchestrator._execute_step = MethodType(fake_execute, orchestrator)
        orchestrator._check_quality_gate = MethodType(
            lambda self, expert_id, output: {"passed": True}, orchestrator
        )

        state = orchestrator.run_full("smoke idea", stop_at="§3", workflow_id="wf_smoke")
        assert state.status == WorkflowStatus.PAUSED
        assert len(state.completed_steps) == 5

        # A live workflow must still resume if an ephemeral filesystem loses the
        # checkpoint after the human decision has already reached the process.
        (Path(workspace) / "wf_smoke.checkpoint.json").unlink()

        # Human confirmation must provide an exit from a repeatedly failing
        # quality gate instead of returning to the same checkpoint forever.
        orchestrator.approve_next_gate_result("§3")
        orchestrator._check_quality_gate = MethodType(
            lambda self, expert_id, output: {
                "passed": expert_id != "§3",
                "action": "pause" if expert_id == "§3" else "continue",
                "reason": "simulated exhausted retry",
            },
            orchestrator,
        )

        state = orchestrator.resume("wf_smoke", stop_at="§11")
        assert state.status == WorkflowStatus.PAUSED
        assert len(state.completed_steps) == 9

        state = orchestrator.resume("wf_smoke", stop_at="§7")
        assert state.status == WorkflowStatus.PAUSED
        assert len(state.completed_steps) == 11

        state = orchestrator.resume("wf_smoke")
        assert state.status == WorkflowStatus.COMPLETED
        assert len(state.completed_steps) == 17

    print("UI_INTEGRATION_V5_SMOKE_OK: 17/17 experts completed")


if __name__ == "__main__":
    main()
