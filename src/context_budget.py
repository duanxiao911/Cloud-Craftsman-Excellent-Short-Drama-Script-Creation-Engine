"""Task-scoped context selection and preflight token budgets."""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from typing import Any, Dict, Iterable, List, Optional

from src.story_state import StoryState
from src.knowledge_retriever import KnowledgeRetriever


class TokenBudgetExceeded(RuntimeError):
    pass


@dataclass
class TokenBudget:
    system: int = 1800
    knowledge: int = 1200
    context: int = 3500
    output: int = 4000
    total: int = 10500


@dataclass
class BudgetReport:
    system: int
    knowledge: int
    context: int
    output: int
    total: int
    limit: int
    fits: bool


class TokenBudgeter:
    """Conservative, dependency-free estimator (roughly 1 token / 2 CJK chars)."""

    @staticmethod
    def estimate(value: Any) -> int:
        text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        ascii_count = sum(ord(ch) < 128 for ch in text)
        return max(1, (ascii_count + 3) // 4 + (len(text) - ascii_count + 1) // 2)

    def preflight(self, system: str, knowledge: str, context: Any, output_tokens: int, budget: TokenBudget) -> BudgetReport:
        parts = (self.estimate(system), self.estimate(knowledge), self.estimate(context), output_tokens)
        fits = parts[0] <= budget.system and parts[1] <= budget.knowledge and parts[2] <= budget.context
        total = sum(parts)
        report = BudgetReport(*parts, total=total, limit=budget.total, fits=fits and total <= budget.total)
        if not report.fits:
            raise TokenBudgetExceeded(f"Token 预算超限: {asdict(report)}")
        return report


class ContextSelector:
    """Build L0/L1/L2 without defaulting to the whole history."""

    TASK_FIELDS = {
        "ideation": ("premise",),
        "outline": ("premise", "engine", "audience_curves"),
        "episode": ("premise", "engine", "audience_curves"),
        "scene": ("premise", "engine"),
        "patch": ("premise",),
        "audit": ("premise", "engine", "audience_curves"),
    }

    def __init__(self):
        self.raw_retriever = KnowledgeRetriever(chunk_chars=900, overlap_chars=120)

    def build(self, state: StoryState, task: str, node_ids: Optional[Iterable[str]] = None,
              include_raw: bool = False, query: str = "", raw_token_budget: int = 2200) -> Dict[str, Any]:
        fields = self.TASK_FIELDS.get(task, ("premise",))
        l0 = {
            "title": state.project.get("name", ""),
            "genre": state.project.get("genre", ""),
            "mainline": state.premise.get("mainline", state.premise.get("logline", "")),
            "protagonist": state.premise.get("protagonist", ""),
        }
        l1 = {field: getattr(state, field) for field in fields}
        l1["nodes"] = state.select(node_ids or [])
        result = {"level": "L1", "l0": l0, "l1": l1}
        if include_raw:
            result["level"] = "L2"
            raw = state.project.get("raw_material", "")
            chunks = self.raw_retriever.retrieve(raw, query or str(l0), raw_token_budget, TokenBudgeter.estimate, top_k=20)
            result["l2"] = {
                "query": query or str(l0),
                "chunks": self.raw_retriever.serialize(chunks),
                "full_raw_included": False,
            }
        return result
