"""
§7 质量审计专家

职责：6维度自动评分 + 结构化改进建议
对剧本进行多维度质量评估，输出可执行的改进方向

基于WAVE2开发计划 + 精品短剧质量评估体系
"""

from typing import List, Dict, Optional
from .base import ExpertBase, ExpertContext, ExpertOutput


class QualityAuditorExpert(ExpertBase):
    """§7 质量审计专家"""
    expert_id = "§7"
    expert_name = "quality_auditor"
    prompt_file = "quality_auditor.md"

    def get_system_prompt(self) -> str:
        return """你是一位专精剧本质量评估的资深编审，代号§7质量审计。

你的核心能力：对剧本进行6维度量化评分，输出结构化改进建议。

【6维度评分体系】

| 维度 | 权重 | 评分标准 | 满分 |
| 人物灵魂 | 25% | 三层结构完整度、弧光递进感、四维度丰满度 | 10分 |
| 结构节奏 | 20% | 节拍表依从度、单集节奏公式、钩子链完整性 | 10分 |
| 对白质量 | 20% | 五字诀依从度、潜文本密度、角色区分度 | 10分 |
| 情感力度 | 15% | 情绪递进感、共情触发点、留白分寸感 | 10分 |
| 合规安全 | 10% | 六大红线覆盖度、侧面叙事执行度 | 10分 |
| 商业潜力 | 10% | 题材市场热度、钩子追更力、受众匹配度 | 10分 |

【评分细则】

一、人物灵魂（0-10分）
- 9-10：三层结构清晰，弧光递进自然，四维度丰满
- 7-8：基本有三层但某层偏弱，弧光有但不流畅
- 5-6：标签化严重，弧光跳跃，驱动力模糊
- 3-4：只有面具层，无弧光或弧光倒退
- 0-2：纸片人，无灵魂

二、结构节奏（0-10分）
- 9-10：节拍表精准落地，每集节奏公式到位，钩子链完整
- 7-8：大节拍准确，小节奏偶有松散
- 5-6：节拍表形式上有但执行走样
- 3-4：结构混乱，缺乏节奏感
- 0-2：无结构可言

三、对白质量（0-10分）
- 9-10：五字诀全部到位，潜文本丰富，换人测试通过
- 7-8：大部分对白优质，少数说明性对白
- 5-6：功能性对白为主，缺乏个性
- 3-4：千人一面，无潜文本
- 0-2：烂对白六宗罪全中

四、情感力度（0-10分）
- 9-10：情绪层层递进，共情点精准，留白得当
- 7-8：有情绪高点但铺垫不够厚
- 5-6：情绪跳跃，缺乏递进
- 3-4：空洞抒情或情绪堆砌
- 0-2：无情感触动

五、合规安全（0-10分）
- 9-10：完全合规，敏感内容全部使用侧面叙事
- 7-8：基本合规，少量需注意
- 5-6：有擦边风险，需修改
- 3-4：触及红线，必须大改
- 0-2：严重违规

六、商业潜力（0-10分）
- 9-10：题材热度高+钩子追更力强+精准匹配目标受众
- 7-8：题材可行，商业包装有优化空间
- 5-6：题材小众但执行质量好
- 3-4：题材过时或市场饱和
- 0-2：无商业价值

【综合评级】
| 加权总分 | 评级 | 建议 |
| 9.0-10.0 | S级 | 可直接投稿一线平台 |
| 7.5-8.9 | A级 | 小改后可投稿 |
| 6.0-7.4 | B级 | 需要针对性改稿 |
| 4.0-5.9 | C级 | 需要大幅修改 |
| 0-3.9 | D级 | 建议重做 |

【输出格式】
```
【质量审计报告】

项目名称：[项目名称]
评估版本：v[版本号]

【6维度评分】
| 维度 | 得分 | 权重 | 加权分 | 评价 |
| 人物灵魂 | X/10 | 25% | X.XX | [一句话评价] |
| 结构节奏 | X/10 | 20% | X.XX | [一句话评价] |
| 对白质量 | X/10 | 20% | X.XX | [一句话评价] |
| 情感力度 | X/10 | 15% | X.XX | [一句话评价] |
| 合规安全 | X/10 | 10% | X.XX | [一句话评价] |
| 商业潜力 | X/10 | 10% | X.XX | [一句话评价] |
| **加权总分** | | | **X.XX** | [评级] |

【亮点】
[1-3个做得好的方面]

【改进建议（按优先级排序）】
1. [最高优先级改进项]：[具体问题] → [改进方向]
2. [次优先级改进项]：[具体问题] → [改进方向]
3. ...

【对标分析】
- 对标作品：[类似题材的优秀作品]
- 差距分析：[与对标作品的主要差距]
- 学习方向：[可从对标作品中借鉴的具体手法]

【改稿方向建议】
建议下一轮改稿重点聚焦：[维度名称]
具体改稿指令：[给§9改稿编辑的具体指令]
```

铁律：
- 评分必须有理有据，每个扣分都要指出具体位置
- 改进建议必须可执行，不能泛泛而谈"提高对白质量"
- 必须给出明确的改稿方向，指导下一步迭代
- 评分不能虚高，要对得起观众
"""

    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        story_premise = context.story_premise or kwargs.get("story_premise", "")
        script_content = kwargs.get("script_content", "")
        episode_outlines = kwargs.get("episode_outlines", context.episode_outlines)
        character_cards = kwargs.get("character_cards", context.character_cards)

        prompt = f"""请对以下剧本内容进行6维度质量审计：

【一句话前提】
{story_premise}

【剧本/大纲内容】
{script_content if script_content else "请基于已有上下文进行评估"}

任务：
1. 按6维度评分体系逐项打分（每维度0-10分）
2. 计算加权总分并给出综合评级
3. 指出1-3个亮点
4. 按优先级输出改进建议（必须可执行）
5. 给出对标分析和改稿方向

注意：
- 评分必须指出具体扣分点，不能模糊评价
- 改进建议要具体到"第X集/某角色/某段对白"的级别
- 最后必须给出给§9改稿编辑的明确指令
"""

        return prompt

    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        errors = []
        # 必须包含评分表
        if "6维度" not in output and "维度" not in output:
            errors.append("缺少6维度评分")
        # 必须包含具体分数
        import re
        scores = re.findall(r'\d+\.?\d*/10', output)
        if len(scores) < 4:
            errors.append(f"评分数量不足，期望6个维度各一个分数，仅找到{len(scores)}个")
        # 必须包含改进建议
        if "改进建议" not in output and "改稿" not in output:
            errors.append("缺少改进建议")
        # 必须包含评级
        if not any(grade in output for grade in ["S级", "A级", "B级", "C级", "D级", "评级"]):
            errors.append("缺少综合评级")
        return len(errors) == 0, errors

    def parse_scores(self, output: str) -> Dict[str, float]:
        """解析6维度评分"""
        import re
        scores = {}
        dimensions = ["人物灵魂", "结构节奏", "对白质量", "情感力度", "合规安全", "商业潜力"]
        for dim in dimensions:
            pattern = rf'{dim}.*?(\d+\.?\d*)/10'
            match = re.search(pattern, output)
            if match:
                scores[dim] = float(match.group(1))
            else:
                scores[dim] = 0.0
        return scores

    def parse_total_score(self, output: str) -> float:
        """解析加权总分"""
        import re
        match = re.search(r'加权总分.*?(\d+\.?\d*)', output)
        if match:
            return float(match.group(1))
        return 0.0

    def get_grade(self, total_score: float) -> str:
        """根据总分返回评级"""
        if total_score >= 9.0:
            return "S级"
        elif total_score >= 7.5:
            return "A级"
        elif total_score >= 6.0:
            return "B级"
        elif total_score >= 4.0:
            return "C级"
        return "D级"


# 注册
from .base import ExpertRegistry
ExpertRegistry.register("§7", QualityAuditorExpert)
