import sqlite3

from fastapi.testclient import TestClient

from src.adaptation_schema import Character, Confidence, Dialogue, MangaPanel, ValidationStatus, demo_project, manga_demo_project, schema_manifest
from src.api.server import create_app
from src.database import Database


def test_adaptation_schema_has_fact_and_decision_layers():
    manifest = schema_manifest()
    assert manifest["schema_version"] == "1.3.0"
    assert set(manifest["layers"]) == {"visual_source_facts", "source_facts", "adaptation_decisions"}
    assert "story_invariants" in manifest["layers"]["adaptation_decisions"]["tables"]
    assert "change_ledger" in manifest["layers"]["adaptation_decisions"]["tables"]
    assert len(manifest["skill_pack"]["skills"]) == 7
    assert len(manifest["manga_skill_pack"]["skills"]) == 7


def test_manga_panel_keeps_page_and_reading_order():
    panel = MangaPanel(
        id="p01", settings_id="manga_1", page_id="pg01", panel_no=1,
        reading_order=1, bbox=[0.0, 0.0, 0.5, 0.5], scene_description="渡口雨夜",
        character_ids=["char_1"], extraction_confidence=Confidence.high,
    )
    assert panel.page_id == "pg01"
    assert panel.reading_order == 1


def test_source_records_require_traceability():
    character = Character(
        id="char_1",
        settings_id="adapt_1",
        name="许知遥",
        source_chunk_ids=["chunk_1"],
        extraction_confidence=Confidence.high,
    )
    assert character.source_chunk_ids == ["chunk_1"]


def test_original_dialogue_is_validation_baseline():
    dialogue = Dialogue(
        id="line_1",
        settings_id="adapt_1",
        speaker_character_id="char_1",
        content="钟又走了。",
        is_original=True,
        validation_status=ValidationStatus.pending,
        source_chunk_ids=["chunk_1"],
    )
    assert dialogue.validation_status == ValidationStatus.passed


def test_database_initializes_complete_adaptation_tables(tmp_path):
    db_path = tmp_path / "adaptation.db"
    Database(str(db_path)).init_db()
    connection = sqlite3.connect(db_path)
    names = {
        row[0]
        for row in connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'adaptation_%'"
        )
    }
    connection.close()
    required = {
        "adaptation_settings", "adaptation_chunks", "adaptation_characters",
        "adaptation_world", "adaptation_events", "adaptation_event_edges",
        "adaptation_relationships", "adaptation_character_arcs", "adaptation_dialogues",
        "adaptation_story_invariants", "adaptation_plot_beats",
        "adaptation_filmability_issues", "adaptation_proposals",
        "adaptation_change_ledger", "adaptation_value_reviews",
        "adaptation_scene_outlines", "adaptation_runs",
        "adaptation_manga_pages", "adaptation_manga_panels",
        "adaptation_manga_speech_bubbles", "adaptation_manga_visual_characters",
        "adaptation_manga_shot_mappings",
    }
    assert required <= names


def test_adaptation_api_exposes_schema_demo_and_validation():
    with TestClient(create_app()) as client:
        schema = client.get("/api/v1/adaptation/schema")
        assert schema.status_code == 200
        assert schema.json()["skill_pack"]["id"] == "literary-ip-adaptation"

        demo = client.get("/api/v1/adaptation/demo")
        assert demo.status_code == 200
        snapshot = demo.json()
        assert len(snapshot["issues"]) == 3
        assert len(snapshot["invariants"]) == 3

        manga = client.get("/api/v1/adaptation/manga/demo")
        assert manga.status_code == 200
        assert len(manga.json()["pages"]) == 3
        assert len(manga.json()["panels"]) == 8
        assert len(manga.json()["speech_bubbles"]) == 3
        assert len(manga.json()["shot_mappings"]) == 3

        before = client.post("/api/v1/adaptation/validate", json={"snapshot": snapshot})
        assert before.status_code == 200
        assert before.json()["ok"] is False

        for invariant in snapshot["invariants"]:
            invariant["approved"] = True
        after = client.post("/api/v1/adaptation/validate", json={"snapshot": snapshot})
        assert after.status_code == 200
        assert after.json()["ok"] is True


def test_demo_contains_required_adaptation_artifacts():
    demo = demo_project()
    assert len(demo["chapters"]) == 3
    assert len(demo["proposals"]) == 3
    assert len(demo["scene_outlines"]) == 3
    assert len(demo["run"]["stages"]) == 7

    manga = manga_demo_project()
    assert manga["settings"]["source_type"] == "manga"
    assert len(manga["run"]["stages"]) == 8
