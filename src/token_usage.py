"""Observed/estimated token usage ledger."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, Iterable


@dataclass
class TokenUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    evidence: str
    model: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TokenUsageLedger:
    def summarize(self, outputs: Iterable[Any]) -> Dict[str, Any]:
        usages = [output.structured_data.get("token_usage") for output in outputs]
        usages = [item for item in usages if item]
        observed = [item for item in usages if item.get("evidence") == "observed"]
        selected = observed if observed else usages
        return {
            "calls": len(usages),
            "observed_calls": len(observed),
            "evidence": "observed" if usages and len(observed) == len(usages) else "mixed_or_estimated",
            "prompt_tokens": sum(item.get("prompt_tokens", 0) for item in selected),
            "completion_tokens": sum(item.get("completion_tokens", 0) for item in selected),
            "total_tokens": sum(item.get("total_tokens", 0) for item in selected),
        }
