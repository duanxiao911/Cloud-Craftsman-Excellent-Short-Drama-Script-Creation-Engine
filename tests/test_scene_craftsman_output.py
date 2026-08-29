import json

from src.artifact_schema import validate_artifact
from src.experts.scene_craftsman import SceneCraftsmanExpert


def valid_scene_artifact():
    return {
        "scenes": [{
            "scene_id": "E01-S01",
            "episode_id": 1,
            "name": "旧律所档案室",
            "location": "旧律所",
            "space_type": "INT",
            "time_of_day": "夜",
            "atmosphere": "冷寂中藏着迫近的危险",
            "narrative_function": "主角找到被替换的卷宗",
            "senses": {"visual": "冷白灯闪烁", "audio": "纸页摩擦", "touch": "卷宗受潮"},
            "emotional_mapping": "逼仄空间映射主角的困局",
            "production_notes": "单景可拍",
            "transition_out": "用熄灯硬切",
        }],
        "environment_templates": ["冷白灯闪了两下，档案架尽头沉进黑暗。"],
    }


def test_scene_json_requires_non_empty_structured_scenes():
    expert = SceneCraftsmanExpert()
    passed, errors = expert.validate_output(json.dumps(valid_scene_artifact(), ensure_ascii=False))
    assert passed is True
    assert errors == []
    assert validate_artifact("§11", valid_scene_artifact()) == []


def test_scene_json_rejects_empty_scene_array():
    expert = SceneCraftsmanExpert()
    passed, errors = expert.validate_output('{"scenes": []}')
    assert passed is False
    assert "scenes 必须是非空数组" in errors
    assert validate_artifact("§11", {"scenes": []}) == ["artifact.scenes 必须是非空数组"]


def test_scene_json_rejects_incomplete_scene_and_weak_senses():
    expert = SceneCraftsmanExpert()
    artifact = valid_scene_artifact()
    artifact["scenes"][0]["location"] = ""
    artifact["scenes"][0]["senses"] = {"visual": "冷白灯"}
    passed, errors = expert.validate_output(json.dumps(artifact, ensure_ascii=False))
    assert passed is False
    assert any("location" in error for error in errors)
    assert any("感官设计不足2种" in error for error in errors)


def test_legacy_scene_table_parser_accepts_composite_scene_ids():
    expert = SceneCraftsmanExpert()
    scenes = expert.parse_scene_list("| E01-S01 | 档案室 | INT | 冷寂 | 发现线索 |")
    assert scenes == [{
        "scene_id": "E01-S01",
        "name": "档案室",
        "space_type": "INT",
        "atmosphere": "冷寂",
        "narrative_function": "发现线索",
    }]
