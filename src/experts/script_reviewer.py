"""§16 script reviewer on the unified expert protocol."""
from typing import List
from .base import ExpertBase, ExpertContext, ExpertRegistry

class ScriptReviewerExpert(ExpertBase):
    expert_id = "§16"
    expert_name = "script_reviewer"
    prompt_file = "script_reviewer.md"
    def get_system_prompt(self) -> str:
        return "你是剧本审核专家。输出score、issues、strengths、decision的JSON；issues必须含node_id、evidence、diagnosis、repair。"
    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        return f"任务上下文：{context.task_context}\n进行可拍性、人物、因果和追更价值审核。"
    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        if output.lstrip().startswith("{"):
            return True, []
        missing = [item for item in ("评分", "问题", "修改", "结论") if item not in output]
        return not missing, [f"缺少字段：{item}" for item in missing]

ExpertRegistry.register("§16", ScriptReviewerExpert)
ScriptReviewer = ScriptReviewerExpert
