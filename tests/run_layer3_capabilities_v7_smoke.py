"""第三层第8/9项无模型烟测：风格包后端注入与制作包导出。"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.experts.base import ExpertContext, LLMClient
from src.experts.soul_catcher import SoulCatcherExpert
from src.production_export import ProductionExportService
from src.story_state import StoryNode, StoryState
from src.style_packs import STYLE_PACKS


class CaptureLLM(LLMClient):
    def __init__(self):
        self.prompt = ""

    def complete(self, prompt: str, **kwargs) -> str:
        self.prompt = prompt
        return "故事方向：校园纪录片\n一句话前提：两位学生守护旧礼堂\n推荐类型：校园甜宠\n核心情感锚点：毕业前学会告别"

    def complete_json(self, prompt: str, **kwargs):
        return {"raw": self.complete(prompt, **kwargs)}


def verify_style_pack_injection() -> None:
    pack = STYLE_PACKS.get("warm").to_dict()
    assert pack["version"] == "1.0.0"
    assert len(pack["checksum"]) == 64
    client = CaptureLLM()
    expert = SoulCatcherExpert(llm_client=client, culture_kb=None)
    output = expert.execute(ExpertContext(
        story_direction="校园纪录片",
        project_config={"style_pack": pack},
    ))
    assert "=== 风格经验包（硬约束） ===" in client.prompt
    assert "细腻共情 v1.0.0" in client.prompt
    assert output.structured_data["style_pack"]["checksum"] == pack["checksum"]


def verify_structured_exports() -> None:
    state = StoryState(project={"name": "旧礼堂"}, premise={"mainline": "毕业前守护旧礼堂"})
    state.add_node(StoryNode("ART-CHARACTERS", "character_set", {
        "artifact": {"characters": [{"id": "C1", "name": "夏栀", "motivation": "留下毕业记忆", "voice": "轻快但回避告别"}]}
    }))
    state.add_node(StoryNode("ART-SCENES", "scene_design", {
        "artifact": {"scenes": [{
            "source_id": "E01-S01", "episode_id": 1, "location": "旧礼堂",
            "characters": ["C1"], "goal": "阻止拆除", "conflict": "施工队进场",
            "action": "夏栀挡在门前打开直播", "result": "获得24小时举证时间",
            "shots": [{"shot_size": "近景", "camera": "推进", "visual": "手掌压住封条"}],
        }]}
    }, depends_on=["ART-CHARACTERS"]))
    exporter = ProductionExportService(state)
    generic = exporter.build("wf_smoke")
    assert generic["counts"] == {"characters": 1, "scenes": 1, "shots": 1}
    assert generic["scenes"][0]["id"] == "E01-S01"
    assert generic["storyboard"][0]["scene_id"] == "E01-S01"
    assert exporter.build("wf_smoke", "xiaoyunque")["contract"] == "yunjiang.adapter.xiaoyunque.v1"
    assert exporter.build("wf_smoke", "dramaclaw")["contract"] == "yunjiang.adapter.dramaclaw.v1"


if __name__ == "__main__":
    verify_style_pack_injection()
    verify_structured_exports()
    print("LAYER3_CAPABILITIES_V7_SMOKE_OK: versioned style pack + generic/xiaoyunque/dramaclaw exports")
