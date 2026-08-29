import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import MethodType

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from src.api.server import app, workflow_events, workflows
from src.experts.base import ExpertOutput
from src.workflow.orchestrator import Orchestrator, WorkflowStatus


def main() -> None:
    workflow_id = "wf_http_checkpoint_smoke"
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
        state = orchestrator.run_full(
            "HTTP checkpoint smoke",
            stop_at="§11",
            workflow_id=workflow_id,
        )
        assert state.status == WorkflowStatus.PAUSED
        assert "§12" in state.step_outputs
        assert "§5" in state.step_outputs

        workflows[workflow_id] = orchestrator
        workflow_events[workflow_id] = []
        client = TestClient(app)
        response = client.post(
            f"/api/v1/workflow/{workflow_id}/checkpoint-and-resume",
            json={
                "expert_id": "§12",
                "edited_content": "human-approved-outline",
                "artifact_expert_id": "§5",
                "edited_artifact_content": "human-edited-episode-outline",
                "stop_at": "§7",
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "resuming"
        assert orchestrator.state.status == WorkflowStatus.PAUSED
        assert orchestrator.state.expert_sequence[orchestrator.state.current_step] == "§7"
        assert "§11" in orchestrator.state.step_outputs
        assert orchestrator.state.step_outputs["§12"].content == "human-approved-outline"
        assert orchestrator.state.step_outputs["§5"].content == "human-edited-episode-outline"
        assert any(event["type"] == "human_decision" for event in workflow_events[workflow_id])

        workflows.pop(workflow_id, None)
        workflow_events.pop(workflow_id, None)

        # Regression: §11 can also be a rejected quality gate. Confirming that
        # pause must approve/retry §11 itself, not the §5 artifact shown in UI.
        retry_workflow_id = "wf_http_gate_retry_smoke"
        retry_orchestrator = Orchestrator(
            use_full_sequence=True,
            enable_checkpoint=True,
            project_path=workspace,
        )
        retry_orchestrator._execute_step = MethodType(fake_execute, retry_orchestrator)
        retry_orchestrator._check_quality_gate = MethodType(
            lambda self, expert_id, output: {
                "passed": expert_id != "§11",
                "action": "pause" if expert_id == "§11" else "continue",
                "reason": "simulated §11 quality rejection",
                "details": ["scene schema invalid"] if expert_id == "§11" else [],
            },
            retry_orchestrator,
        )
        retry_state = retry_orchestrator.run_full(
            "HTTP quality retry smoke",
            workflow_id=retry_workflow_id,
        )
        assert retry_state.status == WorkflowStatus.PAUSED
        assert retry_state.expert_sequence[retry_state.current_step] == "§11"
        assert "§11" not in retry_state.step_outputs

        workflows[retry_workflow_id] = retry_orchestrator
        workflow_events[retry_workflow_id] = []
        retry_response = client.post(
            f"/api/v1/workflow/{retry_workflow_id}/checkpoint-and-resume",
            json={"expert_id": "§11", "stop_at": "§7"},
        )
        assert retry_response.status_code == 200, retry_response.text
        assert retry_response.json()["retry"] is True
        assert retry_orchestrator.state.status == WorkflowStatus.PAUSED
        assert retry_orchestrator.state.expert_sequence[retry_orchestrator.state.current_step] == "§7"
        assert "§11" in retry_orchestrator.state.step_outputs

        workflows.pop(retry_workflow_id, None)
        workflow_events.pop(retry_workflow_id, None)

    print("CHECKPOINT_HTTP_SMOKE_OK: planned §11 decision + rejected §11 retry resumed to §7")


if __name__ == "__main__":
    main()
