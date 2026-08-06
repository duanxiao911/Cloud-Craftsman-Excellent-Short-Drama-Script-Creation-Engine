"""
集纲审核专家（Episode Outline Reviewer）§17
基于37项「爆款漏斗」标准，逐项审查大纲和集纲
"""

from .base import ExpertBase, ExpertContext, ExpertOutput, BaseInput, BaseOutput
from typing import Dict, Any, List


# ============================================================
# 专家类型化IO定义
# ============================================================

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class EpisodeOutlineReviewerInput(BaseInput):
    """集纲审核专家的输入"""
    episode_outlines: List[Dict] = field(default_factory=list)  # 分集大纲
    payment_nodes: List[int] = field(default_factory=list)  # 付费节点
    target_platform: str = ""  # 目标平台


@dataclass
class EpisodeOutlineReviewerOutput(BaseOutput):
    """集纲审核专家的输出"""
    outline_scores: Dict[str, float] = field(default_factory=dict)  # 各集评分
    funnel_analysis: Dict[str, Any] = field(default_factory=dict)  # 漏斗分析
    payment_point_review: Dict[str, Any] = field(default_factory=dict)  # 付费点审查
    revision_suggestions: List[Dict] = field(default_factory=list)  # 修改建议


class EpisodeOutlineReviewerExpert(ExpertBase):
    """§17 集纲审核专家：基于37项爆款漏斗标准审查大纲"""
    expert_id = "§17"
    expert_name = "episode_outline_reviewer"
    prompt_file = "episode_outline_reviewer.md"

    def execute(self, context: ExpertContext, **kwargs) -> ExpertOutput:
        """执行集纲审核"""
        # 从上下文提取集纲内容
        outlines_content = ""
        if context.episode_outlines:
            for outline in context.episode_outlines:
                ep = outline.get('episode', '?')
                desc = outline.get('description', '')
                outlines_content += f"第{ep}集：{desc}\n"
        elif hasattr(context, 'metadata') and context.metadata.get('step_outputs', {}).get('§3'):
            outlines_content = context.metadata['step_outputs']['§3'].get('content', '')

        beat_table = ""
        if context.beat_table:
            beat_table = str(context.beat_table)

        project_info = {
            'name': context.project_name,
            'genre': context.project_config.get('drama_type', '未指定') if context.project_config else '未指定',
            'synopsis': context.story_direction,
            'total_episodes': context.project_config.get('total_episodes', 30) if context.project_config else 30,
        }

        prompt = self._build_review_prompt(project_info, outlines_content, beat_table)

        try:
            if self.llm_client:
                messages = [
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ]
                review_content = self.llm_client.chat(messages)
            else:
                review_content = self._fallback_review()
        except Exception as e:
            review_content = f"[集纲审核执行异常: {e}]"

        return ExpertOutput(
            expert_name=self.expert_id,
            content=review_content,
            structured_data={"outline_review": review_content, "raw": review_content},
            validation_passed=len(review_content) > 200,
            validation_errors=[] if len(review_content) > 200 else ["审核报告内容过短"],
        )

    def _build_review_prompt(self, project: dict, outlines_content: str, beat_table: str) -> str:
        return f"""请基于37项「爆款漏斗」标准，对以下短剧的分集大纲进行逐项审查。

【项目信息】
项目名称：{project.get('name', '未命名')}
题材类型：{project.get('genre', '未指定')}
故事方向：{project.get('synopsis', '未提供')}
目标集数：{project.get('total_episodes', 30)}集

【节拍表】
{beat_table if beat_table else '（节拍表待生成）'}

【分集大纲】
{outlines_content if outlines_content else '（集纲内容待生成）'}

请从以下维度审查：
1. 黄金前三集：钩子强度、情绪闭环、代入感
2. 付费卡点设计：每集结尾悬念、付费节点爆发力
3. 节奏曲线：冲突升级、爽点密度、疲劳点检测
4. 主线连贯性：核心矛盾聚焦度、伏笔回收
5. 人物弧光：主角成长轨迹、配角功能完整性

输出格式：各维度评分(1-10) + 具体问题 + 修改建议。"""

    def _fallback_review(self) -> str:
        return """【集纲审核报告】

一、黄金前三集评估
- 钩子强度：待评估
- 情绪闭环：待评估
- 代入感：待评估

二、付费卡点设计
- 付费节点悬念：待评估
- 付费转化潜力：待评估

三、节奏曲线
- 冲突升级链：待评估
- 爽点密度：待评估
- 疲劳点检测：待评估

四、主线连贯性
- 核心矛盾聚焦：待评估
- 伏笔回收完整性：待评估

五、人物弧光
- 主角成长轨迹：待评估
- 配角功能完整性：待评估

待LLM接入后输出完整审查报告。"""


# 注册
from .base import ExpertRegistry
ExpertRegistry.register("§17", EpisodeOutlineReviewerExpert)
