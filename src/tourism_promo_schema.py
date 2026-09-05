"""文旅宣传视频 Skill Pack 的机器可读契约。"""

from typing import Any, Dict

from src.skill_registry import TOURISM_PROMO_SKILL_PACK


def schema_manifest() -> Dict[str, Any]:
    return {
        "schema_id": "yunjiang.tourism-promo.production",
        "schema_version": "1.0.0",
        "project_type": "tourism_promo",
        "reuses_agents": 17,
        "skill_pack": {
            "id": "tourism-promo-video",
            "version": "1.0.0",
            "skills": TOURISM_PROMO_SKILL_PACK,
        },
        "brief_fields": [
            "campaign_goal", "target_audience", "duration_seconds", "aspect_ratio",
            "platform", "destination_assets", "verified_facts", "call_to_action",
        ],
        "workflow": [
            "brief", "fact_verification", "concept", "route", "timecoded_script",
            "visual_audio", "platform_cutdowns", "signoff",
        ],
        "required_deliverables": [
            "creative_brief", "fact_check_ledger", "timecoded_av_script",
            "voiceover_and_sync_sound", "shot_execution_sheet", "platform_cutdowns",
            "compliance_report",
        ],
        "quality_gates": {
            "facts": "地点、机构、交通、开放信息和公共服务不得编造",
            "story": "景点必须通过人物目标或任务进入故事，禁止导游词堆砌",
            "timing": "每个镜头必须有起止时间，合计不得超过目标片长",
            "brand": "CTA、落版、署名和官方口径必须可配置、可复核",
        },
    }


def build_runtime_constraints(config: Dict[str, Any]) -> str:
    """把前端文旅配置转换为所有专家都能读取的硬约束。"""
    duration = int(config.get("duration_seconds") or 60)
    rows = [
        "项目类型：文旅宣传视频（单片，不按多集短剧展开）",
        f"传播目标：{config.get('campaign_goal') or '城市形象传播'}",
        f"目标片长：{duration} 秒；全部时间码合计不得超过该时长",
        f"画幅：{config.get('aspect_ratio') or '9:16竖屏'}",
        f"发布平台：{config.get('platform') or '视频号/抖音/小红书'}",
        f"真实文旅资产：{config.get('destination_assets') or '待用户补充，禁止自行编造'}",
        f"传播行动：{config.get('call_to_action') or '引导评论、收藏或到访'}",
        "交付必须包含：分秒级镜头、画面、景别/运镜、旁白、同期声/音乐、转场、字幕、落版、CTA。",
        "必须同时给出主片、60 秒传播版和15 秒钩子版；若主片不足60 秒，只输出主片和15 秒版。",
        "地点、企业、交通、开放时间、政策、人物身份未经材料确认时标记【待核验】，不得补写为事实。",
    ]
    return "\n".join(rows)
