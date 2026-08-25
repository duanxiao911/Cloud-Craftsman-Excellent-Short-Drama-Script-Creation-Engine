"""文学改编工作台的数据契约与零 Token 演示数据。

Schema 分为两层：
1. source_facts：只提取原文明确存在的事实，所有记录保留 source_chunk_ids。
2. adaptation_decisions：诊断、方案、影响与人工审批，不覆盖原著事实。
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator
from src.skill_registry import ADAPTATION_SKILL_PACK, MANGA_ADAPTATION_SKILL_PACK


SCHEMA_VERSION = "1.3.0"


class Confidence(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ValidationStatus(str, Enum):
    pending = "pending"
    retrying = "retrying"
    passed = "passed"
    flagged = "flagged"


class SourceRecord(BaseModel):
    id: str
    settings_id: str
    source_chunk_ids: List[str] = Field(default_factory=list)
    extraction_confidence: Confidence

    @model_validator(mode="after")
    def require_traceability(self):
        if not self.source_chunk_ids:
            raise ValueError("原著事实记录必须包含 source_chunk_ids")
        return self


class Chunk(BaseModel):
    id: str
    settings_id: str
    chapter: Optional[int] = None
    chunk_index: int
    text: str
    type_label: str
    word_count: int


class Character(SourceRecord):
    name: str
    aliases: List[str] = Field(default_factory=list)
    identity: str = "原文未提及"
    personality: List[str] = Field(default_factory=list)
    appearance: str = "原文未提及"
    motivation: str = "原文未提及"
    first_appearance_chunk_id: Optional[str] = None


class WorldFact(SourceRecord):
    category: str
    name: str
    description: str
    related_character_ids: List[str] = Field(default_factory=list)


class Event(SourceRecord):
    chapter: Optional[int] = None
    chunk_index_start: int
    chunk_index_end: Optional[int] = None
    summary: str
    detail: str = ""
    participant_character_ids: List[str]
    event_type: str
    importance: str


class EventEdge(SourceRecord):
    cause_event_id: str
    effect_event_id: str
    relation_type: str = "causes"
    rationale: str = ""


class Relationship(SourceRecord):
    character_id: str
    related_character_id: str
    relation_type: str
    relation_label: str = ""
    chapter_start: Optional[int] = None
    chapter_end: Optional[int] = None
    chunk_index_start: int
    chunk_index_end: Optional[int] = None
    transformation_note: str = ""


class CharacterArc(SourceRecord):
    character_id: str
    stage_name: str
    chapter_start: Optional[int] = None
    chapter_end: Optional[int] = None
    chunk_index_start: int
    chunk_index_end: Optional[int] = None
    description: str
    key_event_ids: List[str] = Field(default_factory=list)


class Dialogue(BaseModel):
    id: str
    settings_id: str
    speaker_character_id: str
    target_character_id: Optional[str] = None
    content: str
    scene_event_id: Optional[str] = None
    emotion: Optional[str] = None
    is_original: bool
    validation_status: ValidationStatus
    validation_note: str = ""
    source_chunk_ids: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def original_dialogue_is_baseline(self):
        if self.is_original:
            self.validation_status = ValidationStatus.passed
            if not self.source_chunk_ids:
                raise ValueError("原文对白必须保留 source_chunk_ids")
        return self


class StoryInvariant(BaseModel):
    id: str
    settings_id: str
    invariant_type: str
    title: str
    description: str
    lock_level: str
    source_chunk_ids: List[str]
    approved_by_human: bool = False


class PlotBeat(BaseModel):
    id: str
    settings_id: str
    sequence_no: int
    event_id: Optional[str] = None
    title: str
    function: str
    preservation_policy: str
    adaptation_note: str = ""
    source_chunk_ids: List[str]


class FilmabilityIssue(BaseModel):
    id: str
    settings_id: str
    beat_id: Optional[str] = None
    issue_type: str
    severity: str
    original_excerpt: str = ""
    diagnosis: str
    modern_value_dimension: str = ""
    source_chunk_ids: List[str]
    status: str = "open"


class AdaptationProposal(BaseModel):
    id: str
    settings_id: str
    issue_id: str
    strategy: str
    adapted_content: str
    rationale: str
    skeleton_impact: str
    downstream_event_ids: List[str] = Field(default_factory=list)
    validation_status: ValidationStatus = ValidationStatus.pending
    selected: bool = False


class ChangeLedgerEntry(BaseModel):
    id: str
    settings_id: str
    proposal_id: str
    original_content: str
    adapted_content: str
    reason: str
    affected_entities: List[str] = Field(default_factory=list)
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None


class ValueReview(BaseModel):
    id: str
    settings_id: str
    proposal_id: Optional[str] = None
    dimension: str
    risk_level: str
    evidence: str
    recommendation: str
    validation_status: ValidationStatus = ValidationStatus.pending


class SceneOutline(BaseModel):
    id: str
    settings_id: str
    episode_no: int
    scene_no: int
    location: str
    time_of_day: str = ""
    character_ids: List[str]
    dramatic_goal: str
    conflict: str
    visual_action: str
    source_event_ids: List[str]
    validation_status: ValidationStatus = ValidationStatus.pending


class MangaPage(BaseModel):
    id: str
    settings_id: str
    page_no: int
    image_ref: str
    reading_direction: str = "ltr"
    width: int = 0
    height: int = 0


class MangaPanel(BaseModel):
    id: str
    settings_id: str
    page_id: str
    panel_no: int
    reading_order: int
    bbox: List[float]
    scene_description: str
    character_ids: List[str] = Field(default_factory=list)
    extraction_confidence: Confidence


class MangaSpeechBubble(BaseModel):
    id: str
    settings_id: str
    panel_id: str
    bubble_no: int
    content: str
    speaker_character_id: Optional[str] = None
    bubble_type: str = "speech"
    emotion: str = "neutral"
    ocr_confidence: float = Field(ge=0, le=1)
    attribution_confidence: Confidence
    human_corrected: bool = False


class MangaVisualCharacter(BaseModel):
    id: str
    settings_id: str
    character_id: str
    panel_ids: List[str]
    visual_signature: str
    continuity_note: str = ""
    extraction_confidence: Confidence


class MangaShotMapping(BaseModel):
    id: str
    settings_id: str
    panel_ids: List[str]
    scene_outline_id: str
    shot_no: int
    shot_size: str
    camera_movement: str = "static"
    adaptation_note: str = ""


TABLE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "visual_source_facts": {
        "tables": ["manga_pages", "manga_panels", "manga_speech_bubbles", "manga_visual_characters", "manga_shot_mappings"],
        "rules": ["page and panel traceability required", "reading order is explicit", "human correction is logged"],
    },
    "source_facts": {
        "tables": ["chunks", "characters", "world", "events", "event_edges", "relationships", "character_arcs", "dialogues"],
        "rules": ["source_chunk_ids required", "no unsupported invention", "row-level extraction_confidence"],
    },
    "adaptation_decisions": {
        "tables": ["story_invariants", "plot_beats", "filmability_issues", "adaptation_proposals", "change_ledger", "value_reviews", "scene_outlines"],
        "rules": ["source facts are immutable", "skeleton impact must be explicit", "human approval before downstream delivery"],
    },
}


def manga_demo_project() -> Dict[str, Any]:
    """返回可直接驱动前端的零 Token 漫画拆解示例。"""
    settings_id = "manga_demo_ferry"
    demo = demo_project()
    demo["settings"].update({
        "id": settings_id,
        "source_type": "manga",
        "source_name": "《末班渡口》漫画样章",
        "source_author": "云匠演示",
        "target_episode_count": 4,
        "total_chapters": 1,
        "total_chunks": 3,
        "total_pages": 3,
        "total_panels": 8,
    })
    demo["pages"] = [
        {"id": "pg01", "page_no": 1, "reading_direction": "ltr", "panel_ids": ["p01", "p02", "p03"]},
        {"id": "pg02", "page_no": 2, "reading_direction": "ltr", "panel_ids": ["p04", "p05", "p06"]},
        {"id": "pg03", "page_no": 3, "reading_direction": "ltr", "panel_ids": ["p07", "p08"]},
    ]
    demo["panels"] = [
        {"id": "p01", "page_id": "pg01", "panel_no": 1, "reading_order": 1, "scene": "暴雨中的废弃渡口，末班船灯亮起", "characters": ["char_xu"], "confidence": "high"},
        {"id": "p02", "page_id": "pg01", "panel_no": 2, "reading_order": 2, "scene": "女孩攥着停摆怀表冲向栈桥", "characters": ["char_xu"], "confidence": "high"},
        {"id": "p03", "page_id": "pg01", "panel_no": 3, "reading_order": 3, "scene": "船夫罗伯挡住登船口", "characters": ["char_xu", "char_luo"], "confidence": "high"},
        {"id": "p04", "page_id": "pg02", "panel_no": 1, "reading_order": 4, "scene": "怀表背面刻着旧城钟楼坐标", "characters": ["char_xu"], "confidence": "high"},
        {"id": "p05", "page_id": "pg02", "panel_no": 2, "reading_order": 5, "scene": "闪回：父亲把账簿藏入钟楼齿轮箱", "characters": ["char_zhou"], "confidence": "medium"},
        {"id": "p06", "page_id": "pg02", "panel_no": 3, "reading_order": 6, "scene": "女孩决定放弃登船，转身奔向钟楼", "characters": ["char_xu"], "confidence": "high"},
        {"id": "p07", "page_id": "pg03", "panel_no": 1, "reading_order": 7, "scene": "钟楼齿轮重新转动，账页从暗格落下", "characters": ["char_xu"], "confidence": "high"},
        {"id": "p08", "page_id": "pg03", "panel_no": 2, "reading_order": 8, "scene": "渡船远去，女孩在晨光里翻开账簿", "characters": ["char_xu"], "confidence": "high"},
    ]
    demo["speech_bubbles"] = [
        {"id": "b01", "panel_id": "p02", "content": "等等！这是最后一班吗？", "speaker": "许知遥", "speaker_id": "char_xu", "emotion": "焦急", "ocr_confidence": 0.98, "attribution_confidence": "high", "human_corrected": False},
        {"id": "b02", "panel_id": "p03", "content": "过了十二点，河只送走想逃的人。", "speaker": "罗伯", "speaker_id": "char_luo", "emotion": "克制", "ocr_confidence": 0.94, "attribution_confidence": "medium", "human_corrected": False},
        {"id": "b03", "panel_id": "p06", "content": "我不是回来逃走的。", "speaker": "许知遥", "speaker_id": "char_xu", "emotion": "坚定", "ocr_confidence": 0.99, "attribution_confidence": "high", "human_corrected": False},
    ]
    demo["shot_mappings"] = [
        {"id": "sm01", "panel_ids": ["p01", "p02", "p03"], "scene": "EP1-SC1", "shot_no": 1, "shot_size": "远景→近景", "camera_movement": "推进", "note": "保留暴雨和怀表作为开场钩子"},
        {"id": "sm02", "panel_ids": ["p04", "p05", "p06"], "scene": "EP2-SC2", "shot_no": 4, "shot_size": "特写→闪回", "camera_movement": "匹配剪辑", "note": "把跨页信息压缩为怀表视觉线索"},
        {"id": "sm03", "panel_ids": ["p07", "p08"], "scene": "EP4-SC4", "shot_no": 9, "shot_size": "中近景→大全景", "camera_movement": "缓慢拉远", "note": "兑现账簿与主动选择"},
    ]
    demo["run"]["id"] = "manga_run_demo_001"
    demo["run"]["stages"] = [
        {"id": "page_prepare", "label": "页面预处理", "agent": "视觉资料员", "skill": "manga-page-normalization", "checks": ["页序", "阅读方向"]},
        {"id": "panel_extract", "label": "画格与对白", "agent": "分镜导演 × 台词打磨师", "skill": "manga-panel-segmentation", "checks": ["画格边界", "OCR与说话人"]},
        {"id": "fact_extract", "label": "视觉事实提取", "agent": "角色考古学家 × 情节编织师", "skill": "manga-event-reconstruction", "checks": ["跨格人物", "动作因果"]},
        *demo["run"]["stages"][2:],
    ]
    return demo


def demo_project() -> Dict[str, Any]:
    """返回可直接驱动前端的零 Token 改编项目。"""
    settings_id = "adapt_demo_zhangmu"
    now = datetime.now().isoformat()
    return {
        "schema_version": SCHEMA_VERSION,
        "settings": {
            "id": settings_id,
            "source_type": "novel",
            "source_name": "《灯影里的旧账》",
            "source_author": "演示文本",
            "target_output_type": "short_drama",
            "target_episode_count": 6,
            "total_chapters": 3,
            "total_chunks": 6,
            "extraction_status": "completed",
            "rights_confirmed": True,
            "created_at": now,
        },
        "chapters": [
            {"chapter": 1, "title": "返乡", "summary": "许知遥回到旧城，发现父亲留下的修表铺即将被拆。"},
            {"chapter": 2, "title": "旧账", "summary": "账簿揭示父亲曾替街坊垫付医疗费用，却被误认为侵吞公款。"},
            {"chapter": 3, "title": "钟声", "summary": "许知遥在钟楼听证会上还原真相，保住街区公共记忆。"},
        ],
        "characters": [
            {"id": "char_xu", "name": "许知遥", "identity": "城市规划师", "motivation": "查清父亲旧案并决定是否保留旧街", "confidence": "high", "source_chunk_ids": ["c01", "c03"]},
            {"id": "char_luo", "name": "罗伯", "identity": "修表铺老伙计", "motivation": "守住真相与街坊体面", "confidence": "high", "source_chunk_ids": ["c02", "c04"]},
            {"id": "char_zhou", "name": "周衡", "identity": "更新项目负责人", "motivation": "在工期与公共价值之间作选择", "confidence": "medium", "source_chunk_ids": ["c03", "c05"]},
        ],
        "events": [
            {"id": "evt_1", "summary": "许知遥收到拆迁通知", "importance": "critical", "source_chunk_ids": ["c01"]},
            {"id": "evt_2", "summary": "罗伯交出父亲留下的账簿", "importance": "critical", "source_chunk_ids": ["c03"]},
            {"id": "evt_3", "summary": "许知遥在听证会上公开账簿真相", "importance": "critical", "source_chunk_ids": ["c05", "c06"]},
        ],
        "invariants": [
            {"id": "inv_1", "type": "theme", "title": "记忆不是发展的对立面", "description": "现代化必须尊重普通人的生活史。", "lock_level": "hard", "source_chunk_ids": ["c01", "c06"], "approved": False},
            {"id": "inv_2", "type": "causality", "title": "账簿推动真相公开", "description": "账簿必须从父亲污名连接到最终澄清。", "lock_level": "hard", "source_chunk_ids": ["c03", "c05"], "approved": False},
            {"id": "inv_3", "type": "character", "title": "许知遥主动完成选择", "description": "主角不能依靠巧合或他人代替完成价值抉择。", "lock_level": "hard", "source_chunk_ids": ["c05", "c06"], "approved": False},
        ],
        "beats": [
            {"id": "beat_1", "sequence": 1, "title": "返乡与拆迁通知", "function": "建立外部目标", "policy": "preserve", "source_chunk_ids": ["c01"]},
            {"id": "beat_2", "sequence": 2, "title": "三页内心回忆", "function": "解释父女隔阂", "policy": "transform", "source_chunk_ids": ["c02"]},
            {"id": "beat_3", "sequence": 3, "title": "发现账簿", "function": "中点揭示", "policy": "preserve", "source_chunk_ids": ["c03"]},
            {"id": "beat_4", "sequence": 4, "title": "强迫老人作证", "function": "获得关键证词", "policy": "transform", "source_chunk_ids": ["c04"]},
            {"id": "beat_5", "sequence": 5, "title": "钟楼听证会", "function": "高潮与主题兑现", "policy": "preserve", "source_chunk_ids": ["c05", "c06"]},
        ],
        "issues": [
            {"id": "issue_1", "beat_id": "beat_2", "type": "internal_monologue", "severity": "high", "title": "内心独白不可直接影视化", "excerpt": "她想起父亲沉默的十年……", "diagnosis": "连续心理描写缺少可见行动，短剧节奏会停滞。", "value": "代际沟通", "source_chunk_ids": ["c02"]},
            {"id": "issue_2", "beat_id": "beat_4", "type": "value_conflict", "severity": "high", "title": "以胁迫老人换取证词", "excerpt": "她以撤销补助相逼，老人终于开口。", "diagnosis": "主角通过权力压迫弱者取得正义，损害人物认同。", "value": "尊重与程序正义", "source_chunk_ids": ["c04"]},
            {"id": "issue_3", "beat_id": "beat_5", "type": "production_cost", "severity": "medium", "title": "千人钟楼集会制作成本过高", "excerpt": "全城人聚集钟楼广场……", "diagnosis": "群众规模和夜景调度不适合低成本短剧。", "value": "公共参与", "source_chunk_ids": ["c05"]},
        ],
        "proposals": [
            {"id": "prop_1", "issue_id": "issue_1", "strategy": "心理行动化", "adapted": "许知遥修复父亲遗留的停摆怀表；每装回一个齿轮，穿插一段未发送的语音。", "rationale": "把内心回忆转为持续动作和声音线索。", "skeleton_impact": "none", "selected": True, "status": "passed"},
            {"id": "prop_2", "issue_id": "issue_2", "strategy": "胁迫改为知情同意", "adapted": "许知遥先公开自己掌握的证据，并承诺匿名保护；老人主动交出录音。", "rationale": "保留获得证词的情节功能，同时符合程序正义。", "skeleton_impact": "none", "selected": True, "status": "pending"},
            {"id": "prop_3", "issue_id": "issue_3", "strategy": "大型集会改为线上线下听证", "adapted": "钟楼只保留12名核心街坊，其他居民通过旧照片投影和直播弹幕参与。", "rationale": "降低制作成本，并强化公共记忆的视觉符号。", "skeleton_impact": "low", "selected": True, "status": "pending"},
        ],
        "scene_outlines": [
            {"episode": 1, "scene": 1, "location": "旧街修表铺", "goal": "让许知遥面对拆迁决定", "conflict": "职业立场与家族记忆冲突", "visual": "停摆怀表与墙上红色拆字同框"},
            {"episode": 2, "scene": 3, "location": "修表铺后间", "goal": "发现账簿的真实用途", "conflict": "罗伯是否交出秘密", "visual": "账页夹着一张张医院收据"},
            {"episode": 6, "scene": 4, "location": "钟楼听证室", "goal": "公开真相并形成更新共识", "conflict": "工期压力与公众证据对峙", "visual": "怀表重新走动，投影中的老街照片逐格亮起"},
        ],
        "run": {
            "id": "adapt_run_demo_001",
            "status": "ready",
            "current_stage": "source_import",
            "checkpoint": None,
            "stages": [
                {"id": "source_import", "label": "导入与分块", "agent": "文本解剖师", "skill": "source-chunking", "checks": ["章节边界", "出处索引"]},
                {"id": "fact_extract", "label": "原著事实提取", "agent": "角色考古学家 × 情节编织师", "skill": "source-fact-extraction", "checks": ["禁止脑补", "置信度"]},
                {"id": "skeleton_lock", "label": "故事骨架确认", "agent": "改编总监", "skill": "story-invariant-lock", "checks": ["主题不变", "因果不变"]},
                {"id": "filmability", "label": "影视化诊断", "agent": "场景美术师 × 合规审核官", "skill": "filmability-diagnosis", "checks": ["可拍性", "现代价值"]},
                {"id": "proposal", "label": "改编方案", "agent": "改编编剧", "skill": "adaptation-proposal", "checks": ["最小改动", "影响范围"]},
                {"id": "validation", "label": "一致性复核", "agent": "知识校验官", "skill": "adaptation-validation", "checks": ["骨架守恒", "角色一致"]},
                {"id": "delivery", "label": "分场交付", "agent": "二创协调师", "skill": "adaptation-delivery", "checks": ["变更台账", "分场可拍"]},
            ],
        },
    }


def schema_manifest() -> Dict[str, Any]:
    return {
        "schema": "yunjiang.adaptation",
        "schema_version": SCHEMA_VERSION,
        "layers": TABLE_REGISTRY,
        "validation_state": [item.value for item in ValidationStatus],
        "confidence": [item.value for item in Confidence],
        "human_checkpoints": ["story_invariants", "adaptation_proposals", "final_delivery"],
        "skill_pack": {"id": "literary-ip-adaptation", "version": "1.0.0", "skills": ADAPTATION_SKILL_PACK},
        "manga_skill_pack": {"id": "manga-ip-adaptation", "version": "1.0.0", "skills": MANGA_ADAPTATION_SKILL_PACK},
    }
