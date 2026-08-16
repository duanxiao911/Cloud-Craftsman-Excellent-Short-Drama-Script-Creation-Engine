"""Versioned Agent/Skill registry used by runtime evidence and demo tooling."""

from typing import Dict, Any


SKILLS: Dict[str, Dict[str, Any]] = {
    "§10": {"id": "workflow-strategy", "name": "工作流策略编排", "version": "1.0.0", "checks": ["目标完整性", "专家依赖", "交付范围"]},
    "§0": {"id": "story-soul-discovery", "name": "故事灵魂提炼", "version": "1.0.0", "checks": ["核心命题", "情感承诺", "受众价值"]},
    "§2": {"id": "content-compliance", "name": "内容合规审查", "version": "1.0.0", "checks": ["内容红线", "平台风险", "文化表达"]},
    "§8": {"id": "project-configuration", "name": "短剧项目配置", "version": "1.0.0", "checks": ["集数规格", "受众定位", "制作边界"]},
    "§1": {"id": "character-arc-design", "name": "角色弧线设计", "version": "1.1.0", "checks": ["人物目标", "关系冲突", "成长闭环"]},
    "§3": {"id": "story-structure-design", "name": "剧情结构设计", "version": "1.1.0", "checks": ["因果链", "节奏曲线", "关键反转"]},
    "§4": {"id": "dialogue-voice-design", "name": "对白声线设计", "version": "1.0.0", "checks": ["角色区分", "潜台词", "口语节奏"]},
    "§5": {"id": "episode-script-writing", "name": "分集剧本生成", "version": "1.2.0", "checks": ["场次目标", "戏剧冲突", "结尾钩子"]},
    "§12": {"id": "episode-outline-review", "name": "集纲结构审核", "version": "1.0.0", "checks": ["连续性", "重复度", "推进效率"]},
    "§11": {"id": "scene-craft", "name": "场景可拍化", "version": "1.0.0", "checks": ["动作表达", "空间关系", "制作可行性"]},
    "§6": {"id": "screenplay-formatting", "name": "剧本格式标准化", "version": "1.0.0", "checks": ["场次格式", "人物标记", "制作字段"]},
    "§7": {"id": "multi-axis-quality-audit", "name": "多维质量审计", "version": "1.1.0", "checks": ["结构", "人物", "节奏", "情绪", "信息", "兑现"]},
    "§9": {"id": "targeted-revision", "name": "定向改稿", "version": "1.0.0", "checks": ["问题归因", "最小修改", "回归验证"]},
    "§13": {"id": "visual-storytelling", "name": "视觉叙事设计", "version": "1.0.0", "checks": ["镜头语言", "视觉母题", "声音设计"]},
    "§14": {"id": "commercial-positioning", "name": "商业定位评估", "version": "1.0.0", "checks": ["市场差异", "传播钩子", "变现路径"]},
    "§16": {"id": "script-production-review", "name": "剧本生产审核", "version": "1.0.0", "checks": ["人物一致", "因果完整", "可拍性"]},
    "§15": {"id": "final-quality-signoff", "name": "终审签发", "version": "1.0.0", "checks": ["质量门禁", "风险收敛", "交付完整"]},
}


def skill_for(expert_id: str) -> Dict[str, Any]:
    return dict(SKILLS.get(expert_id, {"id": "unknown", "name": "未登记技能", "version": "0.0.0", "checks": []}))

