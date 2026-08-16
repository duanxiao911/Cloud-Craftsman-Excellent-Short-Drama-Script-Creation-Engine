"""§5 structured episode writer."""
from typing import List
from .base import ExpertBase, ExpertContext, ExpertRegistry

class EpisodeWriterExpert(ExpertBase):
    expert_id = "§5"
    expert_name = "episode_writer"
    prompt_file = "episode_writer.md"
    def get_system_prompt(self) -> str:
        return "你是分集编剧。只输出JSON，包含episodes数组；每集必须有episode_id、goal、conflict、choice、cost、new_information、result、payoffs、new_hook、next_expectation。"
    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        return f"任务上下文：{context.task_context}\n先生成结构化分集，不扩写场景正文。"
    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        if output.lstrip().startswith("{") and "episodes" in output:
            return True, []
        required = ("episode_id", "goal", "conflict", "choice", "cost", "new_information", "result", "new_hook", "next_expectation")
        missing = [item for item in required if item not in output]
        return not missing, [f"分集输出缺少：{item}" for item in missing]

ExpertRegistry.register("§5", EpisodeWriterExpert)
