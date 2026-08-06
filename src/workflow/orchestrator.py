"""
工作流编排器 v2.0

管理专家执行顺序、上下文传递、状态追踪和断点续传

整合特性：
- 知识库真实加载（从 knowledge/experts/{expert_id}.md 读取）
- 三维质量评分（规则层0.3 + LLM层0.5 + 结构层0.2）
- 返工回滚机制（质量不达标时自动回退重试）
- 类型化IO接口（BaseInput/BaseOutput）
- Token使用追踪

基于《架构设计.md》用户交互流程：
§0灵魂捕手→§2合规守门员→§8项目配置师→§1角色铸造师→§4对白大师→§3结构建筑师→§13视觉导演
"""

import json
import os
import re
import copy
import time
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any, Callable, Tuple
from datetime import datetime
from pathlib import Path
from enum import Enum

from src.experts.base import (
    ExpertBase, ExpertContext, ExpertOutput, ExpertRegistry,
    BaseInput, BaseOutput,
)
from src.experts.soul_catcher import SoulCatcherExpert
from src.experts.character_forger import CharacterForgerExpert
from src.experts.compliance_guard import ComplianceGuardExpert
from src.experts.structure_architect import StructureArchitectExpert
from src.experts.dialogue_master import DialogueMasterExpert
from src.experts.project_configurator import ProjectConfiguratorExpert
from src.experts.visual_director import VisualDirectorExpert
from src.experts.episode_writer import EpisodeWriterExpert
from src.knowledge.culture_kb import CultureKnowledgeBase


MAX_REVISIONS = 2  # 审核失败最大重试次数（v2.0提升为2次）
QUALITY_THRESHOLD = 0.6  # 质量分低于此值触发回滚
KNOWLEDGE_DIR = "knowledge/experts"  # 专家知识库目录


class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    BLOCKED = "blocked"
    NEEDS_REVISION = "needs_revision"
    ROLLED_BACK = "rolled_back"


@dataclass
class QualityScore:
    """三维质量评分"""
    rule_score: float = 0.0      # 规则层（0.3权重）：字数、格式、关键字段
    llm_score: float = 0.0       # LLM层（0.5权重）：预留接口，暂用规则近似
    structure_score: float = 0.0 # 结构层（0.2权重）：JSON结构完整度
    total: float = 0.0           # 加权总分
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "rule_score": round(self.rule_score, 3),
            "llm_score": round(self.llm_score, 3),
            "structure_score": round(self.structure_score, 3),
            "total": round(self.total, 3),
            "details": self.details,
        }


@dataclass
class WorkflowState:
    workflow_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    current_step: int = 0
    total_steps: int = 8
    expert_sequence: List[str] = field(default_factory=list)
    completed_steps: List[int] = field(default_factory=list)
    context_snapshot: Optional[ExpertContext] = None
    step_outputs: Dict[str, ExpertOutput] = field(default_factory=dict)
    quality_scores: Dict[str, QualityScore] = field(default_factory=dict)
    error_message: Optional[str] = None
    failed_validations: List[str] = field(default_factory=list)
    revision_counts: Dict[str, int] = field(default_factory=dict)
    rollback_history: List[Dict] = field(default_factory=list)
    blocked_reason: Optional[str] = None
    token_usage: Dict[str, int] = field(default_factory=lambda: {"prompt": 0, "completion": 0, "total_requests": 0})
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at


class Orchestrator:
    """工作流编排器 v2.0

    集成能力：
    - 知识库真实加载：从 knowledge/experts/ 目录读取专家prompt
    - 三维质量评分：规则层(0.3) + LLM层(0.5,预留) + 结构层(0.2)
    - 返工回滚：质量不达标时自动回退到上一步快照重试
    - 类型化IO：通过 BaseInput/BaseOutput 与专家交互
    """

    DEFAULT_SEQUENCE = ["§0", "§2", "§8", "§1", "§4", "§3", "§5", "§13"]

    SEQUENCE_DESCRIPTIONS = {
        "§0": "灵魂捕手：对话式追问，确认故事方向",
        "§2": "合规守门员：红线扫描，输出风险评级",
        "§8": "项目配置师：将方向拆解为完整项目设定",
        "§1": "角色铸造师：三层四维度人设+弧光线",
        "§4": "对白大师：语料库生成+对白风格卡+钩子链",
        "§3": "结构建筑师：救猫咪节拍表+23段落+弧光追踪",
        "§5": "分集编剧：将大纲展开为完整分场剧本",
        "§13": "视觉导演：光影系统+镜头系统+声音系统",
    }

    # 每个专家的最低质量期望（字数阈值）
    EXPERT_MIN_LENGTH = {
        "§0": 200,
        "§2": 100,
        "§8": 500,
        "§1": 800,
        "§4": 600,
        "§3": 1000,
        "§5": 3000,
        "§13": 500,
    }

    def __init__(
        self,
        expert_sequence: Optional[List[str]] = None,
        llm_client=None,
        knowledge_base_path: Optional[str] = None,
        project_path: Optional[str] = None,
        enable_checkpoint: bool = True,
        enable_culture_kb: bool = True,
        enable_quality_gate: bool = True,
        enable_rollback: bool = True,
    ):
        self.expert_sequence = expert_sequence or self.DEFAULT_SEQUENCE
        self.llm_client = llm_client
        self.knowledge_base_path = knowledge_base_path
        self.project_path = project_path or "./workspace"
        self.enable_checkpoint = enable_checkpoint
        self.enable_quality_gate = enable_quality_gate
        self.enable_rollback = enable_rollback

        # 第5.5层：中华优秀传统文化知识库
        self.culture_kb = CultureKnowledgeBase() if enable_culture_kb else None

        # 知识库缓存：{expert_id: (content, mtime)}
        self._knowledge_cache: Dict[str, Tuple[str, float]] = {}

        self.state: Optional[WorkflowState] = None
        self._expert_instances: Dict[str, ExpertBase] = {}
        self._callbacks: Dict[str, List[Callable]] = {
            "on_step_start": [],
            "on_step_complete": [],
            "on_step_error": [],
            "on_step_rollback": [],
            "on_workflow_complete": [],
        }

    # ============================================================
    # 知识库真实加载
    # ============================================================

    def _load_expert_knowledge(self, expert_id: str) -> Optional[str]:
        """从 knowledge/experts/{expert_id}.md 真实读取专家知识库

        使用 mtime 缓存，文件修改后自动重新加载。
        返回 None 表示该专家没有外部知识库（使用内嵌prompt）。
        """
        # 映射 expert_id (如 §0) 到文件名
        expert_name_map = {
            "§0": "soul_catcher",
            "§1": "character_forger",
            "§2": "compliance_guard",
            "§3": "structure_architect",
            "§4": "dialogue_master",
            "§5": "episode_writer",
            "§7": "quality_auditor",
            "§8": "project_configurator",
            "§9": "visual_director",
            "§10": "compliance_guard",
            "§11": "quality_auditor",
            "§12": "quality_director",
            "§13": "visual_director",
            "§14": "business_strategist",
            "§15": "script_reviewer",
            "§16": "episode_outline_reviewer",
        }

        filename = expert_name_map.get(expert_id)
        if not filename:
            return None

        filepath = os.path.join(KNOWLEDGE_DIR, f"{filename}.md")
        if not os.path.exists(filepath):
            return None

        # 检查缓存
        try:
            current_mtime = os.path.getmtime(filepath)
        except OSError:
            return None

        if expert_id in self._knowledge_cache:
            cached_content, cached_mtime = self._knowledge_cache[expert_id]
            if cached_mtime == current_mtime:
                return cached_content

        # 读取文件
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self._knowledge_cache[expert_id] = (content, current_mtime)
            return content
        except (OSError, IOError):
            return None

    # ============================================================
    # 三维质量评分
    # ============================================================

    def _calc_quality_score(self, expert_id: str, output: ExpertOutput, context: ExpertContext) -> QualityScore:
        """计算三维质量评分

        三个维度：
        1. 规则层（权重0.3）：字数达标、格式规范、关键字段存在
        2. LLM层（权重0.5）：预留接口，暂用规则近似（后续接入LLM评审）
        3. 结构层（权重0.2）：structured_data完整度、可解析性

        返回 QualityScore 对象，包含各维度分数和加权总分。
        """
        details = {}

        # --- 规则层（0.3）---
        content = output.content or ""
        content_len = len(content)
        min_len = self.EXPERT_MIN_LENGTH.get(expert_id, 200)

        # 字数得分：达标=1.0，不足按比例扣
        length_score = min(1.0, content_len / max(min_len, 1))

        # 格式得分：有标题/分段/列表
        format_score = 0.0
        if re.search(r'^#\s+', content, re.MULTILINE):
            format_score += 0.3  # 有标题
        if re.search(r'^##\s+', content, re.MULTILINE):
            format_score += 0.2  # 有子标题
        if re.search(r'^[-*]\s+', content, re.MULTILINE):
            format_score += 0.2  # 有列表
        if re.search(r'^\d+[.、]\s+', content, re.MULTILINE):
            format_score += 0.2  # 有编号
        if '\n\n' in content:
            format_score += 0.1  # 有分段
        format_score = min(1.0, format_score)

        rule_score = (length_score * 0.6 + format_score * 0.4)
        details["rule"] = {
            "content_length": content_len,
            "min_expected": min_len,
            "length_score": round(length_score, 3),
            "format_score": round(format_score, 3),
        }

        # --- LLM层（0.5，预留接口）---
        # 当前使用规则近似：检查关键领域词/结构标记
        llm_score = 0.0
        if expert_id == "§0":
            # 灵魂捕手：应有故事方向、人物、冲突
            keywords = ["故事", "主角", "冲突", "方向", "主题"]
            llm_score = sum(0.2 for kw in keywords if kw in content)
        elif expert_id == "§1":
            # 角色铸造师：应有角色名、性格、背景
            keywords = ["性格", "背景", "动机", "弧光", "关系"]
            llm_score = sum(0.2 for kw in keywords if kw in content)
        elif expert_id == "§3":
            # 结构建筑师：应有节拍、段落、转折
            keywords = ["节拍", "铺垫", "转折", "高潮", "结局"]
            llm_score = sum(0.2 for kw in keywords if kw in content)
        elif expert_id == "§5":
            # 分集编剧：应有集数、场景、对白
            keywords = ["第", "集", "场景", "对白", "镜头"]
            llm_score = sum(0.2 for kw in keywords if kw in content)
        else:
            # 通用：有实质内容（非空、非纯模板）
            llm_score = 0.5 if content_len > min_len else content_len / (min_len * 2)
        llm_score = min(1.0, llm_score)
        details["llm"] = {"approximated": True, "score": round(llm_score, 3)}

        # --- 结构层（0.2）---
        struct_score = 0.0
        sd = output.structured_data or {}
        if sd:
            struct_score += 0.4  # 有structured_data
            if "raw" in sd:
                struct_score += 0.2  # 有原始内容备份
            # 检查关键子字段
            expected_keys = {
                "§0": ["story_direction", "raw"],
                "§1": ["character_cards", "raw"],
                "§2": ["risk_level", "raw"],
                "§3": ["beat_table", "episode_outlines", "raw"],
                "§4": ["dialogue_corpus", "raw"],
                "§5": ["episode_scripts", "raw"],
                "§8": ["raw"],
                "§13": ["visual_scheme", "raw"],
            }
            keys = expected_keys.get(expert_id, ["raw"])
            key_hit = sum(1 for k in keys if k in sd)
            struct_score += 0.4 * (key_hit / max(len(keys), 1))
        else:
            # 没有structured_data但有content，给部分分
            struct_score = 0.2 if content else 0.0
        struct_score = min(1.0, struct_score)
        details["structure"] = {
            "has_structured_data": bool(sd),
            "keys_present": list(sd.keys()) if sd else [],
            "score": round(struct_score, 3),
        }

        # --- 加权总分 ---
        total = rule_score * 0.3 + llm_score * 0.5 + struct_score * 0.2

        return QualityScore(
            rule_score=rule_score,
            llm_score=llm_score,
            structure_score=struct_score,
            total=total,
            details=details,
        )

    # ============================================================
    # 返工回滚机制
    # ============================================================

    def run_with_rollback(
        self,
        step_index: int,
        context: ExpertContext,
        max_retries: int = MAX_REVISIONS,
        **kwargs,
    ) -> Tuple[ExpertOutput, QualityScore]:
        """执行专家步骤，质量不达标时回滚重试

        流程：
        1. 保存当前context快照
        2. 执行专家
        3. 计算质量分
        4. 若低于阈值，恢复快照并重试（最多max_retries次）
        5. 返回最终输出和质量分

        返回：(output, quality_score)
        """
        expert_id = self.expert_sequence[step_index]
        best_output = None
        best_score = None
        context_snapshot = copy.deepcopy(context)

        for attempt in range(max_retries + 1):
            output = self._execute_step(step_index, context, **kwargs)
            score = self._calc_quality_score(expert_id, output, context)

            if best_score is None or score.total > best_score.total:
                best_output = output
                best_score = score

            # 质量达标，直接返回
            if score.total >= QUALITY_THRESHOLD or not self.enable_rollback:
                if attempt > 0 and self.state:
                    self.state.rollback_history.append({
                        "expert_id": expert_id,
                        "attempts": attempt + 1,
                        "final_score": score.to_dict(),
                        "timestamp": datetime.now().isoformat(),
                    })
                return output, score

            # 质量不达标，回滚重试
            if attempt < max_retries:
                # 恢复context
                for attr in ["story_direction", "story_premise", "project_config",
                             "character_cards", "dialogue_corpus", "beat_table",
                             "episode_outlines", "visual_scheme", "risk_level", "risk_warnings"]:
                    setattr(context, attr, getattr(context_snapshot, attr))

                self._trigger_callback("on_step_rollback", expert_id, attempt + 1, score)

                if self.state:
                    self.state.rollback_history.append({
                        "expert_id": expert_id,
                        "attempt": attempt + 1,
                        "score": score.to_dict(),
                        "action": "retry",
                        "timestamp": datetime.now().isoformat(),
                    })

        # 所有重试完成，返回最佳结果
        return best_output, best_score

    # ============================================================
    # 专家实例管理
    # ============================================================

    def _get_expert_instance(self, expert_id: str) -> Optional[ExpertBase]:
        """获取专家实例（懒加载+缓存）"""
        if expert_id in self._expert_instances:
            return self._expert_instances[expert_id]

        expert_class = ExpertRegistry.get(expert_id)
        if expert_class:
            # 尝试注入知识库内容
            knowledge = self._load_expert_knowledge(expert_id)
            instance = expert_class(
                llm_client=self.llm_client,
                knowledge_base_path=self.knowledge_base_path,
                culture_kb=self.culture_kb,
            )
            # 如果知识库有内容，注入到实例
            if knowledge and hasattr(instance, '_system_prompt'):
                instance._system_prompt = knowledge
            self._expert_instances[expert_id] = instance
            return instance
        return None

    # ============================================================
    # 工作流执行
    # ============================================================

    def _init_workflow(self, user_input: str, **kwargs) -> WorkflowState:
        workflow_id = f"wf_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        context = ExpertContext(
            story_direction=user_input,
            metadata={
                "user_input": user_input,
                "created_at": datetime.now().isoformat(),
            },
        )
        state = WorkflowState(
            workflow_id=workflow_id,
            expert_sequence=self.expert_sequence,
            context_snapshot=context,
            total_steps=len(self.expert_sequence),
            status=WorkflowStatus.PENDING,
        )
        self.state = state
        return state

    def _execute_step(self, step_index: int, context: ExpertContext, **kwargs) -> ExpertOutput:
        """执行单个专家步骤"""
        expert_id = self.expert_sequence[step_index]
        expert_instance = self._get_expert_instance(expert_id)

        if not expert_instance:
            return ExpertOutput(
                expert_name=expert_id,
                content=f"[错误] 未找到专家: {expert_id}",
                validation_passed=False,
                validation_errors=[f"专家{expert_id}未注册"],
            )

        self._trigger_callback("on_step_start", expert_id, step_index, context)

        try:
            # §5分集编剧：使用分批生成逻辑
            if expert_id == "§5":
                output = self._execute_episode_batch(expert_instance, context, **kwargs)
            else:
                output = expert_instance.execute(context, **kwargs)

            self._update_context_from_output(expert_id, output, context)
            self._trigger_callback("on_step_complete", expert_id, step_index, output)

            return output

        except Exception as e:
            error_output = ExpertOutput(
                expert_name=expert_id,
                content=f"[执行错误] {str(e)}",
                validation_passed=False,
                validation_errors=[str(e)],
            )
            self._trigger_callback("on_step_error", expert_id, step_index, e)
            return error_output

    def _execute_episode_batch(self, expert, context: ExpertContext, **kwargs) -> ExpertOutput:
        """
        §5分集编剧分批生成：每次5集，循环生成完整分场剧本。
        每批传入前文内容以保持风格连贯。
        """
        total_episodes = 30
        if context.project_config:
            ep_val = context.project_config.get("episodes") or context.project_config.get("total_episodes")
            if ep_val:
                try:
                    total_episodes = int(ep_val)
                except (ValueError, TypeError):
                    pass

        batch_size = 5
        all_content = []

        for batch_start in range(1, total_episodes + 1, batch_size):
            batch_end = min(batch_start + batch_size - 1, total_episodes)
            episodes = list(range(batch_start, batch_end + 1))

            print(f"  [§5] 生成第{batch_start}-{batch_end}集剧本...")

            prev_content = "\n".join(all_content[-2000:]) if all_content else ""

            output = expert.execute(
                context,
                target_episodes=episodes,
                previous_content=prev_content,
                max_tokens=16000,
            )
            all_content.append(output.content)
            print(f"  [§5] 第{batch_start}-{batch_end}集完成，字数约{len(output.content)}")

        combined_content = "\n\n".join(all_content)
        print(f"  [§5] 全部{total_episodes}集剧本生成完成，总字数约{len(combined_content)}")

        return ExpertOutput(
            expert_name="§5",
            content=combined_content,
            structured_data={"episode_scripts": {"raw": combined_content}, "raw": combined_content},
            validation_passed=True,
        )

    def _update_context_from_output(self, expert_id: str, output: ExpertOutput, context: ExpertContext):
        """从专家输出更新context"""
        if expert_id == "§0":
            sd = {}
            if "故事方向：" in output.content or "故事方向:" in output.content:
                dir_match = re.search(r'故事方向[：:]\s*(.+)', output.content)
                if dir_match:
                    sd["story_direction"] = dir_match.group(1).strip()
                    context.story_direction = dir_match.group(1).strip()
                    if not context.story_premise:
                        context.story_premise = dir_match.group(1).strip()
            if "一句话前提：" in output.content or "一句话前提:" in output.content:
                prem_match = re.search(r'一句话前提[：:]\s*(.+)', output.content)
                if prem_match:
                    sd["story_premise"] = prem_match.group(1).strip()
                    context.story_premise = prem_match.group(1).strip()
            if "推荐类型：" in output.content or "推荐类型:" in output.content:
                type_match = re.search(r'推荐类型[：:]\s*(.+)', output.content)
                if type_match:
                    sd["drama_type"] = type_match.group(1).strip()
                    if not context.project_config:
                        context.project_config = {}
                    context.project_config["drama_type"] = type_match.group(1).strip()
            sd["raw"] = output.content
            output.structured_data = sd

        elif expert_id == "§2":
            context.risk_level = self._parse_risk_level(output.content)
            context.risk_warnings = self._parse_warnings(output.content)
            output.structured_data = {
                "risk_level": context.risk_level,
                "risk_warnings": context.risk_warnings,
                "raw": output.content,
            }

        elif expert_id == "§8":
            if "project_config" not in context.metadata:
                context.metadata["project_config"] = {}
            context.metadata["project_config"]["raw"] = output.content
            sd = {"raw": output.content}
            if not context.story_premise:
                prem_match = re.search(r'一句话前提[：:]\s*(.+)', output.content)
                if prem_match:
                    context.story_premise = prem_match.group(1).strip()
                    sd["story_premise"] = context.story_premise
                else:
                    overview_match = re.search(r'(?:项目概述|故事概述|核心前提)[：:]\s*(.+)', output.content)
                    if overview_match:
                        context.story_premise = overview_match.group(1).strip()
                        sd["story_premise"] = context.story_premise
            for key, patterns in {
                "title": [r'剧名[：:]\s*(.+)'],
                "episodes": [r'集数[：:]\s*(\d+)', r'(\d+)\s*集'],
                "genre": [r'类型[：:]\s*(.+)'],
            }.items():
                for p in patterns:
                    m = re.search(p, output.content)
                    if m:
                        sd[key] = m.group(1).strip()
                        break
            output.structured_data = sd

        elif expert_id == "§1":
            cards = self._parse_character_cards(output.content)
            context.character_cards = cards
            if not context.metadata.get("step_outputs"):
                context.metadata["step_outputs"] = {}
            context.metadata["step_outputs"]["§1"] = {"content": output.content}
            output.structured_data = {
                "character_cards": cards,
                "character_count": len(cards),
                "raw": output.content,
            }

        elif expert_id == "§4":
            context.dialogue_corpus = {"raw": output.content}
            output.structured_data = {
                "dialogue_corpus": {"raw": output.content},
                "raw": output.content,
            }

        elif expert_id == "§3":
            beats = self._parse_beats(output.content)
            outlines = self._parse_outlines(output.content, context.project_config.get("total_episodes", 30) if context.project_config else 30)
            context.beat_table = beats
            context.episode_outlines = outlines
            if not context.metadata.get("step_outputs"):
                context.metadata["step_outputs"] = {}
            context.metadata["step_outputs"]["§3"] = {"content": output.content}
            output.structured_data = {
                "beat_table": beats,
                "episode_outlines": outlines,
                "beat_count": len(beats),
                "outline_count": len(outlines),
                "raw": output.content,
            }

        elif expert_id == "§5":
            if "episode_scripts" not in context.metadata:
                context.metadata["episode_scripts"] = {}
            context.metadata["episode_scripts"]["raw"] = output.content
            output.structured_data = {
                "episode_scripts": {"raw": output.content},
                "raw": output.content,
            }

        elif expert_id == "§13":
            context.visual_scheme = {"raw": output.content}
            output.structured_data = {
                "visual_scheme": {"raw": output.content},
                "raw": output.content,
            }

    # ============================================================
    # 解析工具方法
    # ============================================================

    @staticmethod
    def _parse_risk_level(content: str) -> str:
        m = re.search(r'风险评级[：:]\s*(.+)', content)
        if m:
            line = m.group(1)
            if "🔴" in line or "红" in line or "red" in line.lower():
                return "red"
            if "🟡" in line or "黄" in line or "yellow" in line.lower():
                return "yellow"
            if "🟢" in line or "绿" in line or "green" in line.lower():
                return "green"
        if "🔴" in content:
            return "red"
        elif "🟡" in content:
            return "yellow"
        return "green"

    @staticmethod
    def _parse_warnings(content: str) -> List[Dict]:
        warnings = []
        lines = content.split('\n')
        for line in lines:
            if '→' in line and any(r in line for r in ['红线', '风险', '禁区']):
                warnings.append({"raw": line.strip(), "severity": "high" if '🔴' in line else "medium"})
        return warnings

    @staticmethod
    def _parse_character_cards(content: str) -> List[Dict]:
        """
        宽松的多策略角色卡解析器。
        策略1: 角色名[：:]xxx
        策略2: 按 ### 分割
        策略3: 按 **名字** 模式
        策略4: 按 ## 大标题分割
        策略5: 兜底 - 整段内容作为单个角色卡
        """
        cards = []

        # 策略1
        blocks = re.split(r'角色名[：:]', content)
        if len(blocks) > 1:
            for block in blocks[1:]:
                name_match = re.match(r'\s*(\S+)', block)
                if name_match:
                    cards.append({"name": name_match.group(1), "raw": block.strip()})
            if cards:
                return cards

        # 策略2
        sections = re.split(r'###\s+', content)
        if len(sections) > 1:
            for section in sections[1:]:
                first_line = section.split('\n')[0].strip()
                skip_patterns = ['语料库', '角色分析总结', '使用方法', '输出说明', '总结', '附注', '注释']
                if any(p in first_line for p in skip_patterns):
                    continue
                section_content = section.strip()
                if len(section_content) > 20:
                    name_match = re.match(r'([^\n（(：:，,]{2,20})', first_line)
                    if name_match:
                        name = name_match.group(1).strip().strip('*').strip()
                        if name and len(name) >= 2:
                            cards.append({"name": name, "name_line": first_line, "raw": section_content})
            if cards:
                return cards

        # 策略3
        bold_blocks = re.split(r'\*\*([^*]+)\*\*', content)
        if len(bold_blocks) > 2:
            for i in range(1, len(bold_blocks), 2):
                name = bold_blocks[i].strip()
                if len(name) >= 2 and len(name) <= 15 and i + 1 < len(bold_blocks):
                    block_content = bold_blocks[i + 1].strip()
                    if len(block_content) > 20:
                        cards.append({"name": name, "raw": block_content})
            if cards:
                return cards

        # 策略4
        h2_sections = re.split(r'##\s+', content)
        if len(h2_sections) > 2:
            for section in h2_sections[1:]:
                first_line = section.split('\n')[0].strip()
                skip_patterns = ['角色', '人物', '总', '附录', '说明', '使用']
                if any(p in first_line for p in skip_patterns):
                    continue
                if len(section.strip()) > 30:
                    name_match = re.match(r'([^\n（(：:，,]{2,20})', first_line)
                    if name_match:
                        name = name_match.group(1).strip().strip('*').strip()
                        cards.append({"name": name, "name_line": first_line, "raw": section.strip()})
            if cards:
                return cards

        # 策略5（兜底）
        if content.strip():
            cards.append({"name": "主要角色", "raw": content.strip()})

        return cards

    @staticmethod
    def _parse_beats(content: str) -> List[Dict]:
        beats = []
        beat_nums = re.findall(r'#?\d+[.、]\s*', content)
        for i, _ in enumerate(beat_nums[:15]):
            beats.append({"beat_num": i + 1})
        return beats

    @staticmethod
    def _parse_outlines(content: str, total_episodes: int = 30) -> List[Dict]:
        outlines = []
        ep_pattern = r'【?第?\s*(\d+)\s*集[】:]?\s*(.{10,100})'
        matches = re.findall(ep_pattern, content)
        for ep_num, desc in matches:
            outlines.append({
                "episode": int(ep_num) if ep_num.isdigit() else 0,
                "description": desc.strip(),
            })
        return outlines

    # ============================================================
    # 回调系统
    # ============================================================

    def _trigger_callback(self, event: str, *args):
        for callback in self._callbacks.get(event, []):
            try:
                callback(*args)
            except Exception:
                pass

    def on(self, event: str, callback: Callable):
        if event in self._callbacks:
            self._callbacks[event].append(callback)

    # ============================================================
    # 断点续传
    # ============================================================

    def _save_checkpoint(self):
        if not self.enable_checkpoint or not self.state:
            return
        checkpoint_path = os.path.join(self.project_path, f"{self.state.workflow_id}.checkpoint.json")
        os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
        with open(checkpoint_path, "w", encoding="utf-8") as f:
            json.dump({
                "workflow_id": self.state.workflow_id,
                "status": self.state.status.value,
                "current_step": self.state.current_step,
                "expert_sequence": self.state.expert_sequence,
                "completed_steps": self.state.completed_steps,
                "context": self.state.context_snapshot.to_dict() if self.state.context_snapshot else {},
                "step_outputs": {k: v.to_dict() for k, v in self.state.step_outputs.items()},
                "quality_scores": {k: v.to_dict() for k, v in self.state.quality_scores.items()},
                "rollback_history": self.state.rollback_history,
                "token_usage": self.state.token_usage,
            }, f, ensure_ascii=False, indent=2)

    def _load_checkpoint(self, workflow_id: str) -> Optional[WorkflowState]:
        checkpoint_path = os.path.join(self.project_path, f"{workflow_id}.checkpoint.json")
        if not os.path.exists(checkpoint_path):
            return None
        with open(checkpoint_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        context = ExpertContext(**data.get("context", {}))
        outputs = {k: ExpertOutput(**v) for k, v in data.get("step_outputs", {}).items()}
        quality_scores = {k: QualityScore(**v) for k, v in data.get("quality_scores", {}).items()}
        state = WorkflowState(
            workflow_id=data["workflow_id"],
            status=WorkflowStatus(data["status"]),
            current_step=data["current_step"],
            expert_sequence=data["expert_sequence"],
            completed_steps=data["completed_steps"],
            context_snapshot=context,
            step_outputs=outputs,
            quality_scores=quality_scores,
            rollback_history=data.get("rollback_history", []),
            token_usage=data.get("token_usage", {"prompt": 0, "completion": 0, "total_requests": 0}),
        )
        return state

    # ============================================================
    # 主执行入口
    # ============================================================

    def run_full(self, user_input: str, stop_at: Optional[str] = None, **kwargs) -> WorkflowState:
        """执行完整工作流

        流程：
        1. 初始化workflow state
        2. 按序列执行每个专家
        3. 每步执行后计算质量分（enable_quality_gate=True时）
        4. 质量不达标时触发回滚重试（enable_rollback=True时）
        5. 红风险时阻断工作流
        6. 保存checkpoint
        """
        state = self._init_workflow(user_input)
        state.status = WorkflowStatus.RUNNING

        for step_idx, expert_id in enumerate(self.expert_sequence):
            state.current_step = step_idx

            # 使用回滚机制执行步骤
            if self.enable_quality_gate:
                output, score = self.run_with_rollback(step_idx, state.context_snapshot, **kwargs)
                state.quality_scores[expert_id] = score
            else:
                output = self._execute_step(step_idx, state.context_snapshot, **kwargs)
                score = self._calc_quality_score(expert_id, output, state.context_snapshot)
                state.quality_scores[expert_id] = score

            state.step_outputs[expert_id] = output

            # 审核验证：失败时最多重试MAX_REVISIONS次
            if not output.validation_passed:
                state.failed_validations.append(expert_id)
                revision_count = state.revision_counts.get(expert_id, 0)
                if revision_count < MAX_REVISIONS:
                    state.revision_counts[expert_id] = revision_count + 1
                    state.status = WorkflowStatus.NEEDS_REVISION
                    state.updated_at = datetime.now().isoformat()
                    retry_output = self._execute_step(step_idx, state.context_snapshot, **kwargs)
                    state.step_outputs[expert_id] = retry_output
                    output = retry_output
                    state.status = WorkflowStatus.RUNNING

            state.completed_steps.append(step_idx)
            self._save_checkpoint()

            # 红风险阻断：暂停工作流
            if expert_id == "§2" and getattr(state.context_snapshot, "risk_level", None) == "red":
                state.status = WorkflowStatus.BLOCKED
                state.blocked_reason = f"§2合规守门员检测到红色风险，工作流已阻断"
                state.updated_at = datetime.now().isoformat()
                self._save_checkpoint()
                return state

            if stop_at and expert_id == stop_at:
                state.status = WorkflowStatus.PAUSED
                state.updated_at = datetime.now().isoformat()
                return state

        state.status = WorkflowStatus.COMPLETED
        state.updated_at = datetime.now().isoformat()
        self._trigger_callback("on_workflow_complete", state)
        return state

    def run_step(self, expert_id: str, context: Optional[ExpertContext] = None, **kwargs) -> ExpertOutput:
        if expert_id not in self.expert_sequence:
            return ExpertOutput(
                expert_name=expert_id,
                content=f"[错误] 专家{expert_id}不在当前工作流序列中",
                validation_passed=False,
                validation_errors=[f"专家{expert_id}不在序列{self.expert_sequence}中"],
            )

        step_idx = self.expert_sequence.index(expert_id)
        working_context = context or (self.state.context_snapshot if self.state else ExpertContext())

        # 使用回滚机制
        if self.enable_quality_gate:
            output, score = self.run_with_rollback(step_idx, working_context, **kwargs)
            if self.state:
                self.state.quality_scores[expert_id] = score
        else:
            output = self._execute_step(step_idx, working_context, **kwargs)

        if self.state:
            self.state.step_outputs[expert_id] = output
            self.state.context_snapshot = working_context
            self._save_checkpoint()

        return output

    def resume(self, workflow_id: str) -> WorkflowState:
        state = self._load_checkpoint(workflow_id)
        if not state:
            raise ValueError(f"未找到断点: {workflow_id}")
        self.state = state
        state.status = WorkflowStatus.RUNNING

        for step_idx, expert_id in enumerate(self.expert_sequence):
            if step_idx in state.completed_steps:
                continue
            state.current_step = step_idx

            if self.enable_quality_gate:
                output, score = self.run_with_rollback(step_idx, state.context_snapshot)
                state.quality_scores[expert_id] = score
            else:
                output = self._execute_step(step_idx, state.context_snapshot)

            state.step_outputs[expert_id] = output
            state.completed_steps.append(step_idx)
            self._save_checkpoint()

        state.status = WorkflowStatus.COMPLETED
        state.updated_at = datetime.now().isoformat()
        return state

    # ============================================================
    # 状态查询
    # ============================================================

    def get_progress(self) -> Dict:
        if not self.state:
            return {"status": "not_started"}
        return {
            "workflow_id": self.state.workflow_id,
            "status": self.state.status.value,
            "current_step": self.state.current_step,
            "total_steps": self.state.total_steps,
            "current_expert": self.expert_sequence[self.state.current_step] if self.state.current_step < len(self.expert_sequence) else None,
            "completed_experts": [self.expert_sequence[i] for i in self.state.completed_steps],
            "completed_count": len(self.state.completed_steps),
            "quality_scores": {k: v.to_dict() for k, v in self.state.quality_scores.items()},
            "rollback_count": len(self.state.rollback_history),
            "token_usage": dict(self.state.token_usage),
        }

    def list_available_experts(self) -> List[Dict]:
        experts = []
        for expert_id, desc in self.SEQUENCE_DESCRIPTIONS.items():
            name = desc.split("：")[1] if "：" in desc else expert_id
            knowledge = self._load_expert_knowledge(expert_id)
            experts.append({
                "id": expert_id,
                "name": name,
                "description": desc,
                "in_sequence": expert_id in self.expert_sequence,
                "has_knowledge_file": knowledge is not None,
                "knowledge_size": len(knowledge) if knowledge else 0,
            })
        return experts


def create_default_orchestrator(**kwargs) -> Orchestrator:
    """创建默认配置的工作流编排器"""
    return Orchestrator(**kwargs)


__all__ = ["Orchestrator", "WorkflowState", "WorkflowStatus", "QualityScore"]
