from src.tourism_promo_schema import build_runtime_constraints, schema_manifest


def test_tourism_schema_exposes_skill_pack_and_delivery_contract():
    manifest = schema_manifest()
    assert manifest["project_type"] == "tourism_promo"
    assert manifest["reuses_agents"] == 17
    assert len(manifest["skill_pack"]["skills"]) == 8
    assert "timecoded_av_script" in manifest["required_deliverables"]
    assert "platform_cutdowns" in manifest["required_deliverables"]


def test_runtime_constraints_are_single_film_timecoded_and_fact_safe():
    text = build_runtime_constraints({
        "campaign_goal": "城市形象传播",
        "duration_seconds": 360,
        "aspect_ratio": "dual",
        "platform": "抖音、视频号",
        "destination_assets": "滴水湖、上海天文馆",
        "call_to_action": "来临港，遇见未来的自己",
    })
    assert "单片" in text
    assert "360 秒" in text
    assert "滴水湖、上海天文馆" in text
    assert "时间码" in text
    assert "15 秒" in text


def test_unknown_destination_facts_are_marked_for_verification():
    assert "【待核验】" in build_runtime_constraints({})
