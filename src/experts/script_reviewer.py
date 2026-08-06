"""
剧本审核专家（Script Reviewer）§16
12维度量化评估体系，诊断剧本商业潜力
"""

from .base import ExpertBase, ExpertContext, ExpertOutput, BaseInput, BaseOutput
from typing import Dict, Any, List


# ============================================================
# 专家类型化IO定义
# ============================================================

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class ScriptReviewerInput(BaseInput):
    """剧本审核专家的输入"""
    full_script: str = ""  # 完整剧本
    project_info: Dict[str, Any] = field(default_factory=dict)  # 项目信息
    target_platform: str = ""  # 目标平台


@dataclass
class ScriptReviewerOutput(BaseOutput):
    """剧本审核专家的输出"""
    review_opinions: List[Dict] = field(default_factory=list)  # 审核意见
    dimension_scores: Dict[str, float] = field(default_factory=dict)  # 12维度评分
    commercial_diagnosis: Dict[str, Any] = field(default_factory=dict)  # 商业诊断
    modification_plan: List[Dict] = field(default_factory=list)  # 修改方案


class ScriptReviewerExpert(ExpertBase):
    """§16 剧本审核专家：12维度量化评估，输出商业诊断报告"""
    expert_id = "§16"
    expert_name = "script_reviewer"
    prompt_file = "script_reviewer.md"

    def execute(self, context: ExpertContext, **kwargs) -> ExpertOutput:
        """执行剧本审核"""
        # 从上下文构建审核所需信息
        script_content = ""
        if hasattr(context, 'metadata') and context.metadata.get('step_outputs'):
            for step_output in context.metadata['step_outputs'].values():
                if isinstance(step_output, dict) and 'content' in step_output:
                    script_content += step_output['content'] + "\n\n"

        project = {
            'name': context.project_name,
            'genre': context.project_config.get('drama_type', '未指定'),
            'theme': context.story_premise,
            'episode_count': context.project_config.get('total_episodes', '未指定'),
            'synopsis': context.story_direction,
            'character_profiles': str(context.character_cards) if context.character_cards else '未提供',
        }
        target_platform = kwargs.get('target_platform', '抖音')

        prompt = self._build_review_prompt(project, script_content, target_platform)

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
            review_content = f"[剧本审核执行异常: {e}]"

        return ExpertOutput(
            expert_name=self.expert_id,
            content=review_content,
            structured_data={"review_report": review_content, "raw": review_content},
            validation_passed=len(review_content) > 200,
            validation_errors=[] if len(review_content) > 200 else ["审核报告内容过短"],
        )

    def _build_review_prompt(self, project: dict, script_content: str, target_platform: str) -> str:
        if len(script_content) > 15000:
            script_content = script_content[:15000] + "\n\n...（剧本内容过长，已截取前15000字）..."

        return f"""请对以下短剧剧本进行12维度量化商业诊断评估。

【项目信息】
项目名称：{project.get('name', '未命名')}
题材类型：{project.get('genre', '未指定')}
核心主题：{project.get('theme', '未指定')}
目标集数：{project.get('episode_count', '未指定')}集
目标平台：{target_platform}

故事梗概：
{project.get('synopsis', '未提供')}

人物小传：
{project.get('character_profiles', '未提供')}

【剧本正文】
{script_content if script_content else '（剧本内容待生成）'}

请按12维度量化评估体系输出：评估总览（总分/评级）、各维度评分明细、综合可操作建议、核心结论。"""

    def _fallback_review(self) -> str:
        return """【剧本审核报告】

一、评估总览
- 总体潜力评分：待评估
- 评级：待评估

二、评估维度
1. 目标受众精准度 - 待评估
2. 原创性与差异化 - 待评估
3. 热播契合度 - 待评估
4. 叙事逻辑严密性 - 待评估
5. 钩子强度 - 待评估
6. 爽点设计 - 待评估
7. 节奏与结构 - 待评估
8. 主线连贯性 - 待评估
9. 人物塑造 - 待评估
10. 对白质量 - 待评估
11. 悬念有效性 - 待评估
12. 商业化潜力 - 待评估

三、综合建议
待LLM接入后输出完整评估报告。"""


# 注册
from .base import ExpertRegistry
ExpertRegistry.register("§16", ScriptReviewerExpert)
