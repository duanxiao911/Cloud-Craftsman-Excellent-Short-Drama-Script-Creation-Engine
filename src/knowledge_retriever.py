"""Dependency-free semantic-ish retrieval for task-scoped knowledge injection."""

from __future__ import annotations

import math
import re
from dataclasses import asdict, dataclass
from hashlib import blake2b
from typing import Any, Dict, List


@dataclass
class RetrievedChunk:
    chunk_id: str
    text: str
    score: float


class KnowledgeRetriever:
    """Hashing-vector retrieval suitable for CJK text without external services.

    An embedding provider can replace this class later; unlike prefix truncation this
    ranks every chunk against the current task and injects only relevant passages.
    """

    def __init__(self, dimensions: int = 512, chunk_chars: int = 900, overlap_chars: int = 120):
        self.dimensions = dimensions
        self.chunk_chars = chunk_chars
        self.overlap_chars = overlap_chars

    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text.lower()).strip()

    def _features(self, text: str) -> Dict[int, float]:
        value = self._normalize(text)
        units = re.findall(r"[a-z0-9_]+|[\u3400-\u9fff]", value)
        grams = units + ["".join(units[i:i + 2]) for i in range(max(0, len(units) - 1))]
        vector: Dict[int, float] = {}
        for gram in grams:
            index = int.from_bytes(blake2b(gram.encode("utf-8"), digest_size=4).digest(), "big") % self.dimensions
            vector[index] = vector.get(index, 0.0) + 1.0
        norm = math.sqrt(sum(weight * weight for weight in vector.values())) or 1.0
        return {key: weight / norm for key, weight in vector.items()}

    @staticmethod
    def _cosine(left: Dict[int, float], right: Dict[int, float]) -> float:
        if len(left) > len(right):
            left, right = right, left
        return sum(weight * right.get(key, 0.0) for key, weight in left.items())

    def chunk(self, document: str) -> List[str]:
        sections = [item.strip() for item in re.split(r"(?=^#{1,4}\s)|\n{2,}", document, flags=re.MULTILINE) if item.strip()]
        chunks: List[str] = []
        buffer = ""
        for section in sections:
            if len(buffer) + len(section) + 1 <= self.chunk_chars:
                buffer = f"{buffer}\n{section}".strip()
                continue
            if buffer:
                chunks.append(buffer)
            if len(section) <= self.chunk_chars:
                buffer = section
            else:
                step = max(1, self.chunk_chars - self.overlap_chars)
                chunks.extend(section[i:i + self.chunk_chars] for i in range(0, len(section), step))
                buffer = ""
        if buffer:
            chunks.append(buffer)
        return chunks

    def retrieve(self, document: str, query: str, token_budget: int,
                 token_estimator, top_k: int = 6) -> List[RetrievedChunk]:
        if not document.strip() or token_budget <= 0:
            return []
        query_vector = self._features(query)
        ranked = []
        for index, text in enumerate(self.chunk(document)):
            ranked.append(RetrievedChunk(f"KB-{index + 1:04}", text, round(self._cosine(query_vector, self._features(text)), 6)))
        ranked.sort(key=lambda item: (-item.score, item.chunk_id))
        selected: List[RetrievedChunk] = []
        used = 0
        for item in ranked[:top_k]:
            cost = token_estimator(item.text)
            if used + cost <= token_budget:
                selected.append(item)
                used += cost
        if not selected and ranked:
            # Never return an empty retrieval merely because one chunk exceeds a
            # small budget: preserve the highest-ranked passage and trim safely.
            text = ranked[0].text
            while text and token_estimator(text) > token_budget:
                text = text[: max(1, len(text) * 3 // 4)]
            if text:
                selected.append(RetrievedChunk(ranked[0].chunk_id, text, ranked[0].score))
        return selected

    @staticmethod
    def serialize(chunks: List[RetrievedChunk]) -> List[Dict[str, Any]]:
        return [asdict(chunk) for chunk in chunks]
