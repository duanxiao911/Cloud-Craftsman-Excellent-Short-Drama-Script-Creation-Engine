"""Phase 1 delivery tests using only the Python standard library."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.skill_registry import SKILLS, skill_for
from src.workflow.orchestrator import Orchestrator, WorkflowState, WorkflowStatus
from src.experts.base import ExpertContext, ExpertOutput


class Phase1DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.orchestrator = Orchestrator(
            expert_sequence=["§1", "§3", "§5"],
            project_path=self.tmp.name,
            enable_agent_collaboration=False,
        )
        self.orchestrator.state = WorkflowState(
            workflow_id="wf_phase1_test",
            status=WorkflowStatus.RUNNING,
            current_step=1,
            total_steps=3,
            expert_sequence=["§1", "§3", "§5"],
            completed_steps=[0],
            context_snapshot=ExpertContext(story_direction="测试故事"),
            step_outputs={"§1": ExpertOutput(expert_name="§1", content="角色产物", validation_passed=True)},
        )

    def tearDown(self):
        self.tmp.cleanup()

    def test_all_runtime_agents_have_versioned_skills(self):
        self.assertEqual(set(Orchestrator.FULL_SEQUENCE), set(SKILLS))
        for expert_id in Orchestrator.FULL_SEQUENCE:
            skill = skill_for(expert_id)
            self.assertNotEqual(skill["id"], "unknown")
            self.assertRegex(skill["version"], r"^\d+\.\d+\.\d+$")
            self.assertTrue(skill["checks"])

    def test_cancel_preserves_outputs_and_checkpoint(self):
        events = []
        self.orchestrator.on("on_cancelled", lambda state, reason: events.append((state.status.value, reason)))
        state = self.orchestrator.cancel("评委取消")
        self.assertEqual(state.status, WorkflowStatus.CANCELED)
        self.assertIn("§1", state.step_outputs)
        self.assertEqual(state.completed_steps, [0])
        self.assertEqual(events, [("canceled", "评委取消")])
        checkpoint = Path(self.tmp.name) / "wf_phase1_test.checkpoint.json"
        self.assertTrue(checkpoint.exists())
        payload = json.loads(checkpoint.read_text(encoding="utf-8"))
        self.assertEqual(payload["status"], "canceled")
        self.assertEqual(payload["step_outputs"]["§1"]["content"], "角色产物")

    def test_canceled_workflow_cannot_resume(self):
        self.orchestrator.cancel("评委取消")
        with self.assertRaisesRegex(ValueError, "已取消"):
            self.orchestrator.resume("wf_phase1_test")

    def test_cancel_is_idempotent(self):
        first = self.orchestrator.cancel("第一次取消")
        second = self.orchestrator.cancel("第二次取消")
        self.assertIs(first, second)
        self.assertEqual(second.error_message, "第一次取消")

    def test_api_source_exposes_required_contracts(self):
        source = (Path(__file__).parents[1] / "src" / "api" / "server.py").read_text(encoding="utf-8")
        required = [
            '@app.post("/api/v1/cancel/{workflow_id}")',
            '@app.post("/api/v1/resume/{workflow_id}")',
            '@app.post("/api/v1/workflow/{workflow_id}/checkpoint")',
            '@app.get("/api/v1/events/{workflow_id}")',
            '@app.get("/api/v1/evidence/{workflow_id}")',
            '@app.get("/api/v1/skills")',
            '"schema_version": "1.0.0"',
            '"run_id": workflow_id',
        ]
        for contract in required:
            self.assertIn(contract, source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
