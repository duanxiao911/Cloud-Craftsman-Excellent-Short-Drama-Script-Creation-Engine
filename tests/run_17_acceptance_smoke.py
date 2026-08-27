import sys
from argparse import Namespace
from pathlib import Path
from tempfile import TemporaryDirectory

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.run_17_expert_acceptance import run_acceptance


def main() -> None:
    with TemporaryDirectory() as folder:
        output = Path(folder) / "acceptance.json"
        args = Namespace(
            mode="deterministic",
            allow_paid_api=False,
            idea="失业律师必须在三天内替仇人翻案",
            drama_type="现实悬疑",
            episodes=30,
            timeout_per_expert=90.0,
            output=output,
        )
        report = run_acceptance(args)
        summary = report["summary"]
        assert report["workflow_status"] == "completed"
        assert summary["experts_executed"] == 17
        assert summary["experts_passed"] == 17
        assert summary["skills_registered"] == 17
        assert summary["skills_executed"] == 17
        assert summary["missing_skill_bindings"] == []
        assert summary["failed_experts"] == []
        assert summary["completed"] is True
        assert [item["expert_id"] for item in report["checkpoints"][:3]] == ["§3", "§11", "§7"]
        assert summary["planned_checkpoints_seen"] == 3
        assert output.exists()

    print("ACCEPTANCE_17_SMOKE_OK: 17 experts + 17 skills + checkpoints")


if __name__ == "__main__":
    main()
