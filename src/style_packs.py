"""Versioned, inspectable style experience packs."""

from dataclasses import asdict, dataclass, field
import hashlib
import json
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class StylePack:
    id: str
    version: str
    name: str
    description: str
    global_rules: List[str]
    expert_directives: Dict[str, List[str]] = field(default_factory=dict)
    compatible_genres: List[str] = field(default_factory=list)
    schema_version: str = "1.0"

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        payload["checksum"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return payload


BUILTIN_PACKS = (
    StylePack(
        id="cinematic", version="1.0.0", name="电影质感",
        description="克制对白、视觉叙事、动作承载潜台词。",
        global_rules=["优先用可拍动作而非解释性台词", "场景必须有空间调度、声音或光影变化", "情绪转折必须由人物选择触发"],
        expert_directives={
            "§4": ["对白保留潜台词和停顿，避免把人物动机说透"],
            "§11": ["每场建立视觉母题、空间阻力和可执行调度"],
            "§13": ["镜头设计服务叙事信息，不堆砌空镜和慢动作"],
        },
        compatible_genres=["现实", "悬疑", "情感", "非遗"],
    ),
    StylePack(
        id="hook", version="1.0.0", name="强钩子爽感",
        description="高密度目标、阻断、反制与不可逆结果。",
        global_rules=["每集必须形成目标—阻断—选择—代价闭环", "相邻集不得复用同一种打脸、身份揭晓或威胁模式", "集尾钩子必须改变信息、关系或权力状态"],
        expert_directives={
            "§3": ["按升级阶梯安排对手资源和主角反制，不允许原地冲突"],
            "§5": ["逐集给出唯一选择、可见代价和下一集具体问题"],
            "§7": ["检查爽点兑现密度、重复钩子和压力升级幅度"],
        },
        compatible_genres=["男频", "逆袭", "复仇", "商战"],
    ),
    StylePack(
        id="warm", version="1.0.0", name="细腻共情",
        description="关系细节、情绪递进与克制的双向选择。",
        global_rules=["情绪必须落在具体关系动作上", "避免误会拖延，冲突来自价值差异与真实代价", "甜点和虐点都要改变人物对关系的判断"],
        expert_directives={
            "§1": ["为主要关系设计不同的表达习惯、脆弱点和边界"],
            "§4": ["用错位回应、动作回应和未说出口的信息塑造声纹"],
            "§5": ["每集至少推进一次关系认知，不重复暧昧状态"],
        },
        compatible_genres=["甜宠", "校园", "家庭", "女性成长"],
    ),
    StylePack(
        id="heritage", version="1.0.0", name="文化叙事",
        description="文化元素作为人物选择和冲突机制，而不是说明书。",
        global_rules=["文化知识必须可溯源并区分事实与创作", "技艺流程必须推动人物目标、阻碍或关系变化", "禁止景观化、猎奇化和空泛说教"],
        expert_directives={
            "§2": ["核查文化表述、地域习俗和身份表达风险"],
            "§11": ["每个工艺细节都必须产生动作目标或现场阻力"],
            "§13": ["建立材料、色彩、声音和手部动作组成的文化视觉系统"],
        },
        compatible_genres=["非遗", "民族", "历史", "乡村振兴"],
    ),
)


class StylePackRegistry:
    def __init__(self, packs=BUILTIN_PACKS):
        self._packs = {(pack.id, pack.version): pack for pack in packs}

    def list(self) -> List[Dict[str, Any]]:
        return [pack.to_dict() for pack in self._packs.values()]

    def get(self, pack_id: str, version: Optional[str] = None) -> StylePack:
        candidates = [pack for (pid, _), pack in self._packs.items() if pid == pack_id]
        if not candidates:
            raise KeyError(pack_id)
        if version:
            for pack in candidates:
                if pack.version == version:
                    return pack
            raise KeyError(f"{pack_id}@{version}")
        return sorted(candidates, key=lambda item: tuple(int(part) for part in item.version.split(".")), reverse=True)[0]


STYLE_PACKS = StylePackRegistry()

