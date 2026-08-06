"""
§7 质量审计（Quality Auditor）

职责：三维质量审核系统（规则层+LLM层+结构层），对剧本进行多维度自动评分，
输出结构化质量报告和改进建议。

评分架构：
- 规则层（权重0.3）：关键词+规则匹配，保留原有启发式逻辑
- LLM层（权重0.5）：结构化5维度打分（人物立体度/对白自然度/情节因果性/节奏张力/视觉可拍性）
- 结构层（权重0.2）：纯Python完整性检查（场景标记/对白标记/内容长度/结构划分）

6维度细分：剧情张力/角色深度/对白质量/节奏把控/视觉潜力/商业潜力
评估结果作为§9改稿编辑的决策依据

基于 Wave2 架构设计
"""

import re
import json
from typing import List, Dict, Optional
from .base import ExpertBase, ExpertContext, ExpertOutput, BaseInput, BaseOutput


# 6维度评分标准描述
DIMENSION_CRITERIA = {
    "plot_tension": {
        "name": "剧情张力",
        "weight": 0.25,
        "high": "每集有明确钩子+悬念，冲突层层递进",
        "mid": "主线清晰，偶有平淡但不拖沓",
        "low": "流水账式叙事，缺少戏剧冲突",
    },
    "character_depth": {
        "name": "角色深度",
        "weight": 0.20,
        "high": "三层人设完整，角色弧光清晰",
        "mid": "主角立体，配角基本合格",
        "low": "角色工具化，行为不合人设",
    },
    "dialogue_quality": {
        "name": "对白质量",
        "weight": 0.15,
        "high": "每句对白都有角色辨识度",
        "mid": "大部分对白有个性，少数模板化",
        "low": "对白空洞或角色间无法区分",
    },
    "pacing": {
        "name": "节奏把控",
        "weight": 0.15,
        "high": "信息密度合理，张弛有度",
        "mid": "整体流畅，个别集略快/略慢",
        "low": "严重节奏问题，大量无效场景",
    },
    "visual_potential": {
        "name": "视觉潜力",
        "weight": 0.15,
        "high": "场景描写极具画面感，可直接指导拍摄",
        "mid": "画面感良好，少数场景缺少细节",
        "low": "纯文字叙述，缺少视觉化描写",
    },
    "commercial_viability": {
        "name": "商业潜力",
        "weight": 0.10,
        "high": "题材有明确受众，钩子密度高",
        "mid": "有一定市场空间，差异化不足",
        "low": "受众模糊，缺少商业卖点",
    },
}


# ============================================================
# 专家类型化IO定义
# ============================================================

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class QualityAuditorInput(BaseInput):
    """质量审计专家的输入"""
    script_content: str = ""  # 剧本内容
    character_cards: List[Dict] = field(default_factory=list)  # 角色人设
    structure_outline: str = ""  # 结构大纲
    previous_scores: Optional[Dict] = None  # 上一轮评分（迭代改稿时）


@dataclass
class QualityAuditorOutput(BaseOutput):
    """质量审计专家的输出"""
    rule_score: float = 0.0  # 规则层评分（权重0.3）
    llm_score: float = 0.0  # LLM层评分（权重0.5）
    structure_score: float = 0.0  # 结构层评分（权重0.2）
    final_score: float = 0.0  # 加权总分
    dimension_scores: Dict[str, float] = field(default_factory=dict)  # 6维度细分
    grade: str = ""  # 等级：S/A/B/C/D


class QualityAuditorExpert(ExpertBase):
    """§7 质量审计"""
    expert_id = "§7"
    expert_name = "quality_auditor"
    prompt_file = "quality_auditor.md"

    def get_system_prompt(self) -> str:
        criteria_text = "\n".join([
            f"  - {v['name']}（权重{int(v['weight']*100)}%）：优秀={v['high']}；及格={v['mid']}；不合格={v['low']}"
            for v in DIMENSION_CRITERIA.values()
        ])

        return f"""你是一位剧本质量评估专家，代号§7质量审计。

你的核心能力：对剧本进行6维度自动评分，输出结构化质量报告。

【6维度评分标准（每项1-10分）】
{criteria_text}

【综合评分规则】
- 加权总分 = Σ(维度分 × 权重)
- S级：≥9.0（可直接投产）
- A级：7.5-8.9（微调后可投稿）
- B级：6.0-7.4（需针对性改稿）
- C级：4.0-5.9（大幅修改）
- D级：<4.0（建议重写）

【逐集分析规则】
- 对每一集独立打分，不只看整体
- 标注每集最突出的优点和最严重的问题
- 问题必须具体到集数和场景，不能泛泛而谈

【一致性校验】
- 检查角色言行是否一致
- 检查情节逻辑是否自洽
- 检查时间线是否合理

【输出格式（JSON结构）】

```json
{{
  "overall_score": 7.5,
  "grade": "A",
  "dimensions": {{
    "plot_tension": {{"score": 8, "issues": ["第5集钩子偏弱"]}},
    "character_depth": {{"score": 7, "issues": ["配角B存在感不足"]}},
    ...
  }},
  "episode_scores": [
    {{"episode": 1, "score": 8.2, "strength": "开场钩子强", "weakness": "中段节奏拖"}},
    ...
  ],
  "consistency_issues": ["第12集角色A行为与第3集矛盾"],
  "top3_improvements": [
    {{"priority": "P0", "target": "第5集", "action": "重写钩子场景"}},
    ...
  ]
}}
```
"""

    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        # 获取剧本内容
        script_text = ""
        if context.metadata.get("step_outputs", {}).get("§5"):
            script_text = context.metadata["step_outputs"]["§5"].get("content", "")[:8000]
        elif context.metadata.get("step_outputs", {}).get("§6"):
            script_text = context.metadata["step_outputs"]["§6"].get("content", "")[:8000]
        elif context.metadata.get("episode_scripts"):
            script_text = str(context.metadata["episode_scripts"])[:8000]

        # 角色信息
        chars_text = ""
        if context.character_cards:
            chars_text = "\n".join([
                f"- {card.get('name_line', '未命名')}"
                for card in context.character_cards[:10]
            ])

        # 大纲信息
        outline_text = ""
        if context.metadata.get("step_outputs", {}).get("§3"):
            outline_text = context.metadata["step_outputs"]["§3"].get("content", "")[:3000]

        prompt = f"""请对以下剧本进行6维度质量审计。

【剧本内容】
{script_text if script_text else "暂无剧本内容"}

【角色人设参考】
{chars_text if chars_text else "请从剧本中提取角色"}

【结构大纲参考】
{outline_text if outline_text else "请从剧本推断结构"}

任务：
1. 对6个维度分别打分（1-10分）
2. 逐集独立评分
3. 检查一致性问题
4. 输出Top 3改进建议（按优先级P0/P1/P2排序）
5. 按JSON格式输出完整质量报告
"""
        return prompt

    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        errors = []
        # 尝试解析JSON
        json_match = re.search(r'\{[\s\S]*\}', output)
        if json_match:
            try:
                data = json.loads(json_match.group())
                # 检查必要字段
                if "overall_score" not in data:
                    errors.append("缺少overall_score")
                if "dimensions" not in data:
                    errors.append("缺少dimensions")
                if "top3_improvements" not in data:
                    errors.append("缺少改进建议")
            except json.JSONDecodeError:
                errors.append("JSON格式解析失败")
        else:
            # 非JSON格式也接受，但检查关键内容
            has_score = bool(re.search(r'[总评综合][分：:]\s*\d', output))
            has_dimension = any(kw in output for kw in ["剧情张力", "角色深度", "对白质量", "节奏"])
            if not has_score and not has_dimension:
                errors.append("未找到评分或维度分析")
        return len(errors) == 0, errors


    # ============================================================
    # 三维质量评分系统
    # ============================================================

    def calculate_rule_score(self, content: str) -> float:
        """
        规则层评分（权重0.3）
        
        保留现有关键词扣分逻辑，归一化到0-100分。
        基于正则表达式和关键词匹配进行基础质量评估。
        """
        score = 100.0
        deductions = []

        # 1. 检查对白质量标记
        dialogue_markers = re.findall(r'["“「]|：\s*.{2,}', content)
        if len(dialogue_markers) < 5:
            deductions.append(("对白标记不足", 15))

        # 2. 检查场景标记
        scene_markers = re.findall(r'场景[一二三四五六七八九十\d]|SCENE|【.*?场景|第.*?场', content, re.IGNORECASE)
        if len(scene_markers) < 2:
            deductions.append(("场景划分不明确", 10))

        # 3. 检查情节钩子
        hook_keywords = ["突然", "没想到", "竟然", "意外", "转折", "但是", "然而",
                         "不料", "谁知", "岂料", "出乎意料", "猛地", "骤然"]
        hook_count = sum(1 for kw in hook_keywords if kw in content)
        if hook_count < 2:
            deductions.append(("情节钩子不足", 10))

        # 4. 检查角色深度指标
        depth_indicators = ["内心", "回忆", "矛盾", "挣扎", "犹豫", "决定", "觉醒", "成长"]
        depth_count = sum(1 for kw in depth_indicators if kw in content)
        if depth_count < 2:
            deductions.append(("角色深度不足", 10))

        # 5. 检查冲突/张力
        conflict_keywords = ["对抗", "冲突", "对峙", "争吵", "决裂", "对峙", "反击", "揭露"]
        conflict_count = sum(1 for kw in conflict_keywords if kw in content)
        if conflict_count < 2:
            deductions.append(("冲突张力不足", 10))

        # 6. 检查内容长度
        content_len = len(content)
        if content_len < 500:
            deductions.append(("内容过短", 20))
        elif content_len > 100000:
            deductions.append(("内容可能冗余", 5))

        # 计算扣分
        total_deduction = sum(d[1] for d in deductions)
        score = max(0, score - total_deduction)

        return score

    def calculate_llm_score(self, content: str) -> Dict:
        """
        LLM层评分（权重0.5）
        
        对内容做5维度打分（每维度0-10），返回各维度分数和总分。
        
        评分维度：
        1. 人物立体度 (character_depth)
        2. 对白自然度 (dialogue_naturalness)
        3. 情节因果性 (plot_causality)
        4. 节奏张力 (pacing_tension)
        5. 视觉可拍性 (visual_filmability)
        
        注意：当前为预留接口实现，返回默认分数7.5。
        接入LLM后替换为真实评分——只需修改此方法的实现即可。
        未来接入时，将content发送给LLM，要求返回JSON格式的5维度评分。
        """
        # ============================================================
        # TODO: 接入LLM后替换为真实评分
        # 接入示例（伪代码）：
        # prompt = f"""请对以下剧本内容进行5维度评分（每维度0-10分）：
        # 1. 人物立体度：角色是否立体、有层次？
        # 2. 对白自然度：对白是否自然、有角色辨识度？
        # 3. 情节因果性：情节是否有因果逻辑链？
        # 4. 节奏张力：节奏是否张弛有度？
        # 5. 视觉可拍性：场景是否具备视觉可拍性？
        # 
        # 内容：
        # {content[:3000]}
        # 
        # 请以JSON格式返回：{{"character_depth": 8, "dialogue_naturalness": 7, ...}}"""
        # result = self.llm_client.complete_json(prompt)
        # return result
        # ============================================================

        default_score = 7.5  # 默认分数，等待LLM接入后替换
        
        dimensions = {
            "character_depth": default_score,       # 人物立体度
            "dialogue_naturalness": default_score,  # 对白自然度
            "plot_causality": default_score,        # 情节因果性
            "pacing_tension": default_score,        # 节奏张力
            "visual_filmability": default_score,    # 视觉可拍性
        }
        
        # 计算5维度均分，映射到0-100
        avg_score = sum(dimensions.values()) / len(dimensions)
        llm_score_100 = avg_score * 10  # 0-10 -> 0-100
        
        return {
            "dimensions": dimensions,
            "llm_score_100": llm_score_100,
            "note": "LLM层评分，当前为默认值(7.5)，接入LLM后替换为真实评分",
        }

    def calculate_structure_score(self, content: str) -> Dict:
        """
        结构层评分（权重0.2）
        
        纯Python完整性检查，每项25分，总分0-100：
        1. 场景标记检查（25分）：是否有"场景一""SCENE""【"等
        2. 对白标记检查（25分）：是否有引号、角色名+冒号
        3. 内容长度检查（25分）：是否在500-50000字符范围
        4. 结构划分检查（25分）：是否有集/幕/场等结构划分
        """
        score = 0
        details = {}

        # 1. 场景标记检查（25分）
        scene_patterns = [
            r'场景[一二三四五六七八九十\d]',
            r'SCENE',
            r'【.*?】',
            r'第.*?场',
            r'INT\.|EXT\.',
            r'内景|外景',
        ]
        scene_found = any(re.search(p, content, re.IGNORECASE) for p in scene_patterns)
        if scene_found:
            score += 25
            details["scene_markers"] = "pass"
        else:
            details["scene_markers"] = "fail"

        # 2. 对白标记检查（25分）
        dialogue_patterns = [
            r'["“「].*?["”」]',  # 引号包裹的对白
            r'[\w\u4e00-\u9fa5]+[：:]',              # 角色名+冒号
            r'（.*?）',                                   # 括号指示（动作/情绪）
        ]
        dialogue_found = sum(1 for p in dialogue_patterns if re.search(p, content))
        if dialogue_found >= 1:
            score += 25
            details["dialogue_markers"] = "pass"
        else:
            details["dialogue_markers"] = "fail"

        # 3. 内容长度检查（25分）
        content_len = len(content)
        if 500 <= content_len <= 50000:
            score += 25
            details["content_length"] = f"pass ({content_len} chars)"
        elif content_len < 500:
            details["content_length"] = f"fail (too short: {content_len} chars)"
        else:
            # 超过50000也给分，但标记
            score += 25
            details["content_length"] = f"pass (long: {content_len} chars)"

        # 4. 结构划分检查（25分）
        structure_patterns = [
            r'第.*?[集幕]',
            r'ACT\s*\d',
            r'EPISODE',
            r'PART',
            r'第.*?[幕场]',
            r'Chapter',
        ]
        structure_found = any(re.search(p, content, re.IGNORECASE) for p in structure_patterns)
        if structure_found:
            score += 25
            details["structure_division"] = "pass"
        else:
            details["structure_division"] = "fail"

        return {
            "structure_score": score,
            "details": details,
        }

    def three_dimensional_audit(self, content: str) -> Dict:
        """
        三维质量审核主方法
        
        综合规则层(0.3) + LLM层(0.5) + 结构层(0.2) 的加权评分。
        
        Returns:
            包含三维分数、加权总分、详细分析的完整审核报告
        """
        # 规则层评分（权重0.3）
        rule_score = self.calculate_rule_score(content)

        # LLM层评分（权重0.5）
        llm_result = self.calculate_llm_score(content)
        llm_score = llm_result["llm_score_100"]

        # 结构层评分（权重0.2）
        structure_result = self.calculate_structure_score(content)
        structure_score = structure_result["structure_score"]

        # 加权总分
        final_score = rule_score * 0.3 + llm_score * 0.5 + structure_score * 0.2

        # 确定等级
        if final_score >= 90:
            grade = "S"
        elif final_score >= 75:
            grade = "A"
        elif final_score >= 60:
            grade = "B"
        elif final_score >= 40:
            grade = "C"
        else:
            grade = "D"

        return {
            "rule_score": round(rule_score, 2),
            "llm_score": round(llm_score, 2),
            "structure_score": round(structure_score, 2),
            "final_score": round(final_score, 2),
            "grade": grade,
            "weights": {"rule": 0.3, "llm": 0.5, "structure": 0.2},
            "llm_dimensions": llm_result["dimensions"],
            "structure_details": structure_result["details"],
        }

    
    def execute_with_audit(self, context: ExpertContext, **kwargs) -> ExpertOutput:
        """
        执行三维质量审核。
        
        在标准execute基础上，增加三维评分计算：
        - 先通过LLM生成评分报告（标准流程）
        - 再用三维评分系统对输入内容进行独立评分
        - 将三维评分合并到最终输出
        """
        # 1. 执行标准审核流程（LLM生成评分报告）
        output = self.execute(context, **kwargs)

        # 2. 获取剧本内容
        script_content = ""
        if context.metadata.get("step_outputs", {}).get("§5"):
            script_content = context.metadata["step_outputs"]["§5"].get("content", "")
        elif context.metadata.get("episode_scripts"):
            script_content = str(context.metadata["episode_scripts"])

        # 3. 执行三维质量评分
        if script_content:
            audit_result = self.three_dimensional_audit(script_content)

            # 4. 将三维评分注入structured_data
            output.structured_data.update({
                "three_dimensional_audit": audit_result,
                "rule_score": audit_result["rule_score"],
                "llm_score": audit_result["llm_score"],
                "structure_score": audit_result["structure_score"],
                "final_score": audit_result["final_score"],
                "grade": audit_result["grade"],
            })

        return output

    def parse_scores(self, output: str) -> Dict:
        """
        解析评分结果（启发式方法）。
        
        注意：此方法为启发式预检实现，基于正则表达式和关键词匹配提取评分，
        不代表最终质量判断。正式评审应使用结构化LLM评审流程。
        """
        json_match = re.search(r'\{[\s\S]*\}', output)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        # 尝试从文本中提取分数
        scores = {}
        for dim_key, dim_info in DIMENSION_CRITERIA.items():
            match = re.search(rf'{dim_info["name"]}.*?(\d+(?:\.\d+)?)\s*/?\s*10', output)
            if match:
                scores[dim_key] = float(match.group(1))
        return {"dimensions": scores, "raw": output}


# 注册
from .base import ExpertRegistry
ExpertRegistry.register("§7", QualityAuditorExpert)


