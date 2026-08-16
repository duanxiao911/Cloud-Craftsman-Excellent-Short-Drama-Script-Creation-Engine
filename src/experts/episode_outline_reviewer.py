"""§12 episode-outline reviewer on the unified expert protocol."""
from typing import List
from .base import ExpertBase, ExpertContext, ExpertRegistry

class EpisodeOutlineReviewerExpert(ExpertBase):
    expert_id = "§12"
    expert_name = "episode_outline_reviewer"
    prompt_file = "episode_outline_reviewer.md"
    def get_system_prompt(self) -> str:
        return "你是集纲审核专家。按集定位问题，输出summary、score、issues数组的JSON。每个issue必须包含episode_id、diagnosis和repair。"
    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        return f"任务上下文：{context.task_context}\n审核集纲，禁止复述全文。"
    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        if output.lstrip().startswith("{"):
            return True, []
        missing = [item for item in ("集纲", "审核", "问题", "修改") if item not in output]
        return not missing, [f"缺少字段：{item}" for item in missing]

ExpertRegistry.register("§12", EpisodeOutlineReviewerExpert)
EpisodeOutlineReviewer = EpisodeOutlineReviewerExpert
