"""
⑪ 场景工匠专家

职责：场景氛围细化 + 环境描写增强 + 五感系统
为每个场景设计沉浸式环境描写

基于WAVE2开发计划 + 精品短剧场景设计方法论
"""

import json
import re
from typing import List, Dict, Optional
from .base import ExpertBase, ExpertContext, ExpertOutput


class SceneCraftsmanExpert(ExpertBase):
    """⑪ 场景工匠专家"""
    expert_id = "§11"
    expert_name = "scene_craftsman"
    prompt_file = "scene_craftsman.md"

    def get_system_prompt(self) -> str:
        return """你是一位专精场景设计的资深编剧，代号⑪场景工匠。

你的核心能力：为每个场景设计沉浸式环境描写，构建五感系统，让场景成为叙事的一部分。

【场景设计核心理念】
场景不是背景板，而是叙事的一部分：
- 场景映射人物内心（外部空间=内心状态的隐喻）
- 场景推动情节（环境变化=情节转折的信号）
- 场景承载文化（空间细节=文化基因的载体）

【五感系统】
每个关键场景必须覆盖至少3种感官：

| 感官 | 描写要点 | 示例 |
| 视觉 | 光线、色彩、空间、物体细节 | "蓝白相间的扎染布在风中翻飞" |
| 听觉 | 环境音、人声、静默 | "染缸里气泡咕嘟作响" |
| 嗅觉 | 气味标记场景记忆 | "板蓝根发酵的微酸气息" |
| 触觉 | 质感、温度、湿度 | "粗布磨过指尖的涩感" |
| 味觉 | 食物/空气的味道 | "嘴里泛起的苦涩" |

【场景氛围设计法】

一、氛围三要素
1. 基调：这个场景的整体情绪（压抑/温馨/紧张/荒凉）
2. 焦点：场景中最抓眼球的一个元素
3. 反差：与环境基调形成反差的细节（增强张力）

二、场景-情绪映射表
| 情绪 | 空间特征 | 光线 | 声音 | 色彩 |
| 孤独 | 空旷/封闭 | 单点光/冷光 | 安静/回声 | 冷灰/蓝 |
| 温暖 | 狭小/包围 | 暖黄/烛光 | 人声/柴火 | 暖黄/橙 |
| 紧张 | 逼仄/压迫 | 高对比/闪烁 | 急促/尖锐 | 暗红/黑 |
| 希望 | 开阔/通透 | 自然光/晨光 | 鸟鸣/风 | 明绿/白 |
| 悲伤 | 灰暗/潮湿 | 暗调/阴天 | 雨声/静默 | 灰/暗蓝 |
| 荒诞 | 不协调/错位 | 不自然光 | 不和谐音 | 艳俗色 |

三、场景叙事功能分类
| 功能 | 设计要点 |
| 建立场景 | 交代空间+暗示主题，用1-2个标志物建立世界观 |
| 情感场景 | 环境=内心投射，细节服务于情绪 |
| 冲突场景 | 环境增加压迫感或制造阻碍 |
| 转折场景 | 环境出现变化（天气/光线/声音转变） |
| 过渡场景 | 简洁过渡，不抢戏，用环境变化暗示时间流逝 |
| 高潮场景 | 五感全开，环境细节最密集 |
| 留白场景 | 最少的描写，最大的想象空间 |

【非遗/文化场景专项】
- 技艺展示场景：特写工艺细节，用动作代替解说
- 传统空间场景：用空间布局暗示文化逻辑（如"三房一照壁"的封闭感）
- 文化冲突场景：传统空间vs现代空间的对比
- 文化符号自然融入：不刻意标注，让符号成为生活的一部分

【输出协议】
只输出一个合法 JSON 对象，不要使用 Markdown 代码围栏，不要附加解释。结构如下：
{
  "scenes": [
    {
      "scene_id": "E01-S01",
      "episode_id": 1,
      "name": "场景名称",
      "location": "具体地点",
      "space_type": "INT或EXT",
      "time_of_day": "日或夜",
      "atmosphere": "基调、焦点与反差",
      "narrative_function": "该场景推动的情节",
      "senses": {
        "visual": "视觉设计",
        "audio": "听觉设计",
        "smell": "嗅觉设计",
        "touch": "触觉设计",
        "taste": "没有则为空字符串"
      },
      "emotional_mapping": "环境如何映射人物内心",
      "production_notes": "可拍性与关键细节",
      "transition_out": "进入下一场的转换方式"
    }
  ],
  "environment_templates": ["3-5段可直接使用、每段不超过3行的环境描写"]
}

铁律：
- 场景不是装饰，每个场景必须服务叙事
- 五感描写不是堆砌，选最能传递情绪的3种即可
- 文化场景不能变成旅游宣传片，文化是叙事动力
- 环境描写不超过3行（短剧节奏快，不能长篇写景）
- scenes 必须是非空数组；重点场景必须至少填写3种感官，普通场景至少填写2种
"""

    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        story_premise = context.story_premise or kwargs.get("story_premise", "")
        story_direction = context.story_direction or kwargs.get("story_direction", "")
        drama_type = context.project_config.get("drama_type", "现实主义") if context.project_config else "现实主义"
        episode_outlines = kwargs.get("episode_outlines", context.episode_outlines)
        beat_table = kwargs.get("beat_table", context.beat_table)

        outlines_text = ""
        if episode_outlines:
            outlines_text = "\n".join([
                f"第{ol.get('episode', i+1)}集：{ol.get('description', str(ol))}"
                for i, ol in enumerate(episode_outlines[:10])
            ])

        prompt = f"""请为以下故事设计完整的场景系统：

【一句话前提】
{story_premise}

【故事方向】
{story_direction}

【故事类型】
{drama_type}

【集纲/结构】
{outlines_text if outlines_text else "请基于故事方向推断"}

任务：
1. 设计全剧场景清单（场号+名称+空间类型+氛围基调+叙事功能）
2. 选取5-8个关键场景进行详细的五感设计
3. 设计场景之间的转换方式
4. 提供环境描写模板（可直接使用的描写段落）

注意：
- 每个场景必须服务叙事，不是装饰
- 五感描写选择最能传递情绪的组合
- 如涉及非遗/文化元素，场景要体现文化质感
- 环境描写保持简洁（每处不超过3行）
- 场景空间变化要暗示人物内心和情节走向
- 严格按系统指定的 JSON 协议输出，不要输出 Markdown 或额外说明
"""

        return prompt

    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        candidate = output.strip()
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", candidate)
        if fenced:
            candidate = fenced.group(1)
        if candidate.startswith(("{", "[")):
            try:
                artifact = json.loads(candidate)
            except json.JSONDecodeError as exc:
                return False, [f"场景 JSON 无效或被截断: {exc}"]
            scenes = artifact.get("scenes") if isinstance(artifact, dict) else None
            if not isinstance(scenes, list) or not scenes:
                return False, ["scenes 必须是非空数组"]
            errors = []
            required = ("scene_id", "name", "location", "atmosphere", "narrative_function")
            for index, scene in enumerate(scenes):
                if not isinstance(scene, dict):
                    errors.append(f"第{index + 1}个场景必须是对象")
                    continue
                missing = [key for key in required if not str(scene.get(key, "")).strip()]
                if missing:
                    errors.append(f"场景{scene.get('scene_id', index + 1)}缺少字段: {', '.join(missing)}")
                senses = scene.get("senses", {})
                sense_count = sum(
                    1 for value in senses.values() if str(value).strip()
                ) if isinstance(senses, dict) else 0
                if sense_count < 2:
                    errors.append(f"场景{scene.get('scene_id', index + 1)}感官设计不足2种")
            return len(errors) == 0, errors

        # 兼容已经保存的旧版 Markdown 产物；新请求统一使用 JSON。
        errors = []
        # 必须包含场景清单
        if "场景清单" not in output and "场景" not in output:
            errors.append("缺少场景清单")
        # 必须包含五感设计
        senses = ["视觉", "听觉", "嗅觉", "触觉", "味觉"]
        sense_count = sum(1 for s in senses if s in output)
        if sense_count < 2:
            errors.append(f"五感设计不足，仅覆盖{sense_count}种感官")
        # 必须包含氛围设计
        if "氛围" not in output and "情绪" not in output:
            errors.append("缺少氛围/情绪设计")
        return len(errors) == 0, errors

    def parse_scene_list(self, output: str) -> List[Dict]:
        """解析场景清单"""
        scenes = []
        # 查找场景表格行
        table_rows = re.findall(r'\|\s*(?:场景)?\s*([A-Za-z0-9_-]+)\s*\|(.+)\|', output)
        for row in table_rows:
            parts = [p.strip() for p in row[1].split('|')]
            scenes.append({
                "scene_id": row[0],
                "name": parts[0] if parts else "",
                "space_type": parts[1] if len(parts) > 1 else "",
                "atmosphere": parts[2] if len(parts) > 2 else "",
                "narrative_function": parts[3] if len(parts) > 3 else "",
            })
        return scenes


# 注册
from .base import ExpertRegistry
ExpertRegistry.register("§11", SceneCraftsmanExpert)
