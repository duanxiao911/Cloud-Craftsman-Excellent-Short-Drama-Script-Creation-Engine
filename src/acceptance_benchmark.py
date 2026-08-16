"""Repeatable acceptance metrics; distinguishes observed usage from estimates."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict


@dataclass
class AcceptanceReport:
    passed: bool
    evidence: str
    token_reduction: float
    regeneration_ratio: float
    token_target_met: bool
    patch_target_met: bool
    notes: list[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AcceptanceBenchmark:
    """Targets: 40—60% token reduction and <=20% local regeneration."""

    def evaluate(self, baseline_tokens: int, v3_tokens: int, relevant_text_chars: int,
                 regenerated_chars: int, evidence: str = "estimated") -> AcceptanceReport:
        if baseline_tokens <= 0 or relevant_text_chars <= 0:
            raise ValueError("基线 Token 和相关文本字符数必须大于0")
        reduction = round((baseline_tokens - v3_tokens) / baseline_tokens, 4)
        regen = round(regenerated_chars / relevant_text_chars, 4)
        token_met = 0.40 <= reduction <= 0.60
        patch_met = regen <= 0.20
        notes = []
        if evidence != "observed":
            notes.append("Token 数据不是模型账单/响应 usage 的实测值，不能作为最终生产验收")
        if reduction > 0.60:
            notes.append("降幅超过目标上界，应检查是否裁掉必要上下文")
        return AcceptanceReport(token_met and patch_met and evidence == "observed", evidence, reduction, regen, token_met, patch_met, notes)
