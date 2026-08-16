"""AI精品短剧创作引擎 - 核心引擎层"""

from .rules import RulesEngine, RulePriority, RedLineItem
from .scorer import QualityScorer, DimensionScore
from .type_adapter import TypeAdapter

# Historical public names retained as aliases to the implementations that exist.
RuleEngine = RulesEngine
ComplianceResult = RedLineItem
ScoreDimension = DimensionScore

__all__ = [
    "RuleEngine",
    "RulePriority",
    "ComplianceResult",
    "QualityScorer",
    "ScoreDimension",
    "TypeAdapter",
]
