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
    finish_reason: str = ""
    requested_max_tokens: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TokenUsageLedger:
    @staticmethod
    def summarize_records(usages: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
        records = [dict(item) for item in usages if item]
        observed = [item for item in records if item.get("evidence") == "observed"]
        selected = observed if observed else records
        finish_reasons: Dict[str, int] = {}
        for item in records:
            reason = str(item.get("finish_reason") or "unknown")
            finish_reasons[reason] = finish_reasons.get(reason, 0) + 1
        return {
            "calls": len(records),
            "observed_calls": len(observed),
            "evidence": "observed" if records and len(observed) == len(records) else "mixed_or_estimated",
            "prompt_tokens": sum(item.get("prompt_tokens", 0) for item in selected),
            "completion_tokens": sum(item.get("completion_tokens", 0) for item in selected),
            "total_tokens": sum(item.get("total_tokens", 0) for item in selected),
            "finish_reasons": finish_reasons,
            "truncated_calls": sum(item.get("finish_reason") in {"length", "max_tokens"} for item in records),
        }

    def summarize(self, outputs: Iterable[Any]) -> Dict[str, Any]:
        usages = [output.structured_data.get("token_usage") for output in outputs]
        usages = [item for item in usages if item]
        return self.summarize_records(usages)
