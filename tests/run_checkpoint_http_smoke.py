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

        workflows[workflow_id] = orchestrator
        workflow_events[workflow_id] = []
        client = TestClient(app)
        response = client.post(
            f"/api/v1/workflow/{workflow_id}/checkpoint-and-resume",
            json={
                "expert_id": "§12",
                "edited_content": "human-approved-outline",
                "stop_at": "§7",
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "resuming"
        assert orchestrator.state.status == WorkflowStatus.PAUSED
        assert orchestrator.state.expert_sequence[orchestrator.state.current_step] == "§7"
        assert "§11" in orchestrator.state.step_outputs
        assert any(event["type"] == "human_decision" for event in workflow_events[workflow_id])

        workflows.pop(workflow_id, None)
        workflow_events.pop(workflow_id, None)

    print("CHECKPOINT_HTTP_SMOKE_OK: §11 decision resumed to §7")


if __name__ == "__main__":
    main()
