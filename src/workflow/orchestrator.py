"""
工作流编排器

管理专家执行顺序、上下文传递、状态追踪和断点续传

基于《架构设计.md》用户交互流程：
§0灵魂捕手→§2合规守门员→§8项目配置师→§1角色铸造师→§4对白大师→§3结构建筑师→⑪场景工匠→§6格式工匠→§7质量审计→§9改稿编辑→§13视觉导演→⑭商业操盘→⑮品控总监
"""

import json
import os
import hashlib
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from pathlib import Path
from enum import Enum

from src.experts.base import ExpertBase, ExpertContext, ExpertOutput, ExpertRegistry
from src.experts.soul_catcher import SoulCatcherExpert
from src.experts.character_forger import CharacterForgerExpert
from src.experts.compliance_guard import ComplianceGuardExpert
from src.experts.structure_architect import StructureArchitectExpert
from src.experts.dialogue_master import DialogueMasterExpert
from src.experts.project_configurator import ProjectConfiguratorExpert
from src.experts.visual_director import VisualDirectorExpert
# Wave2 专家导入
from src.experts.format_craftsman import FormatCraftsmanExpert
from src.experts.quality_auditor import QualityAuditorExpert
from src.experts.revision_editor import RevisionEditorExpert
from src.experts.battle_commander import BattleCommanderExpert
from src.experts.scene_craftsman import SceneCraftsmanExpert
from src.experts.business_operator import BusinessOperatorExpert
from src.experts.quality_director import QualityDirectorExpert
from src.experts.episode_writer import EpisodeWriterExpert
from src.experts.episode_outline_reviewer import EpisodeOutlineReviewerExpert
from src.experts.script_reviewer import ScriptReviewerExpert
from src.knowledge.culture_kb import CultureKnowledgeBase
from src.context_budget import ContextSelector, TokenBudget, TokenBudgeter
from src.patch_engine import PatchEngine, StoryPatch
from src.story_state import StoryNode, StoryState
from src.expert_protocol import ExpertStateAdapter
from src.development_gate import GenerationGate, ProjectEvaluator, StoryEngineValidator
from src.audience_quality import AudienceExperienceTracker, DiagnosisRepairPlanner
from src.signing_audit import SigningGate
from src.acceptance_benchmark import AcceptanceBenchmark
from src.token_usage import TokenUsageLedger
from src.development_service import ProjectDevelopmentService
from src.audience_service import AudienceAuditService
from src.signing_service import SigningQualityService
from src.workflow.collaboration import CollaborationCoordinator


class WorkflowStatus(Enum):
    """工作流状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELED = "canceled"


@dataclass
class WorkflowState:
    """工作流状态快照"""
    workflow_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    current_step: int = 0
    total_steps: int = 13
    expert_sequence: List[str] = field(default_factory=list)
    completed_steps: List[int] = field(default_factory=list)
    context_snapshot: Optional[ExpertContext] = None
    step_outputs: Dict[str, ExpertOutput] = field(default_factory=dict)
    collaboration_trace: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at


class Orchestrator:
    """
    工作流编排器

    管理专家执行顺序、上下文传递、状态追踪和断点续传

    完整15专家序列（Wave2扩展版）：
    §0 → §2 → §8 → §1 → §4 → §3 → ⑪ → §6 → §7 → §9(循环) → §13 → ⑭ → ⑮
    """

    # 默认专家执行序列（MVP 7步闭环）
    DEFAULT_SEQUENCE = ["§0", "§2", "§8", "§1", "§4", "§3", "§13"]

    # 完整15专家序列（Wave2扩展）
    FULL_SEQUENCE = ["§10", "§0", "§2", "§8", "§1", "§3", "§4", "§5", "§12", "§11", "§6", "§7", "§9", "§13", "§14", "§16", "§15"]
    BULK_GENERATION_EXPERTS = {"§11", "§6", "§13"}

    # 序列说明
    SEQUENCE_DESCRIPTIONS = {
        "§0": "灵魂捕手：对话式追问，确认故事方向",
        "§2": "合规守门员：红线扫描，输出风险评级",
        "§8": "项目配置师：将方向拆解为完整项目设定",
        "§1": "角色铸造师：三层四维度人设+弧光线",
        "§4": "对白大师：语料库生成+对白风格卡+钩子链",
        "§5": "分集编剧：结构化分集目标、选择、代价和钩子",
        "§3": "结构建筑师：救猫咪节拍表+23段落+弧光追踪",
        "§11": "场景工匠：场景氛围细化+五感系统+环境描写",
        "§12": "集纲审核：逐集定位结构问题并给出修复方案",
        "§6": "格式工匠：专业剧本格式标准化",
        "§7": "质量审计：6维度自动评分+改进建议",
        "§9": "改稿编辑：基于评分的针对性改稿",
        "§13": "视觉导演：光影系统+镜头系统+声音系统",
        "§14": "商业操盘：市场分析+投放策略+变现路径",
        "§15": "品控总监：终审把关+一致性校验+签发",
        "§16": "剧本审核：人物、因果、可拍性和商业诊断",
        "§10": "实战指挥：工作流策略、进度和下一步行动",
    }

    # 质量门禁定义
    QUALITY_GATES = {
        "§2": {"condition": "risk_level != red", "on_fail": "pause"},
        "§7": {"condition": "total_score >= 6.0", "on_fail": "loop_to_§9"},
        "§15": {"condition": "grade in [S, A]", "on_fail": "rollback"},
    }

    def __init__(
        self,
        expert_sequence: Optional[List[str]] = None,
        llm_client=None,
        knowledge_base_path: Optional[str] = None,
        project_path: Optional[str] = None,
        enable_checkpoint: bool = True,
        enable_culture_kb: bool = True,
        use_full_sequence: bool = False,
        token_budget: Optional[TokenBudget] = None,
        enable_agent_collaboration: bool = False,
        max_targeted_retries: int = 2,
    ):
        if expert_sequence:
            self.expert_sequence = expert_sequence
        elif use_full_sequence:
            self.expert_sequence = self.FULL_SEQUENCE
        else:
            self.expert_sequence = self.DEFAULT_SEQUENCE
        self.llm_client = llm_client
        self.knowledge_base_path = knowledge_base_path
        self.project_path = project_path or "./workspace"
        self.enable_checkpoint = enable_checkpoint
        self.token_budget = token_budget or TokenBudget()
        self.context_selector = ContextSelector()
        self.token_budgeter = TokenBudgeter()
        self.patch_engine = PatchEngine()
        self.expert_state_adapter = ExpertStateAdapter()
        self.generation_gate = GenerationGate()
        self.audience_tracker = AudienceExperienceTracker()
        self.repair_planner = DiagnosisRepairPlanner()
        self.signing_gate = SigningGate()
        self.acceptance_benchmark = AcceptanceBenchmark()
        self.token_usage_ledger = TokenUsageLedger()
        self.enable_agent_collaboration = enable_agent_collaboration
        self.collaboration = CollaborationCoordinator(max_targeted_retries=max_targeted_retries)

        # 第5.5层：中华优秀传统文化知识库
        self.culture_kb = CultureKnowledgeBase() if enable_culture_kb else None

        self.state: Optional[WorkflowState] = None
        self._expert_instances: Dict[str, ExpertBase] = {}
        self._revision_count: int = 0  # 改稿迭代计数
        self._max_revisions: int = 3   # 最大改稿轮次
        self._repair_cycle_active: bool = False
        self._cancel_requested: bool = False
        self._cancel_reason: Optional[str] = None
        self._callbacks: Dict[str, List[Callable]] = {
            "on_step_start": [],
            "on_step_complete": [],
            "on_step_error": [],
            "on_checkpoint": [],
            "on_workflow_complete": [],
            "on_quality_gate": [],
            "on_revision_loop": [],
            "on_decision_plan": [],
            "on_supervision": [],
            "on_feedback": [],
            "on_cancelled": [],
        }

    def cancel(self, reason: str = "用户取消") -> WorkflowState:
        """Cooperatively cancel a workflow, preserving all completed outputs."""
        if not self.state:
            raise ValueError("工作流尚未初始化")
        if self.state.status in {WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELED}:
            return self.state
        self._cancel_requested = True
        self._cancel_reason = reason
        self.state.status = WorkflowStatus.CANCELED
        self.state.error_message = reason
        self.state.updated_at = datetime.now().isoformat()
        self._save_checkpoint()
        self._trigger_callback("on_cancelled", self.state, reason)
        return self.state

    def _get_expert_instance(self, expert_id: str) -> Optional[ExpertBase]:
        """获取专家实例（懒加载+缓存）"""
        if expert_id in self._expert_instances:
            return self._expert_instances[expert_id]

        expert_class = ExpertRegistry.get(expert_id)
        if expert_class:
            instance = expert_class(
                llm_client=self.llm_client,
                knowledge_base_path=self.knowledge_base_path,
                culture_kb=self.culture_kb,  # 注入文化知识库
            )
            self._expert_instances[expert_id] = instance
            return instance
        return None

    def _init_workflow(self, user_input: str, **kwargs) -> WorkflowState:
        """初始化工作流状态"""
        workflow_id = f"wf_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        story_state = StoryState(
            project={"name": kwargs.get("project_name", ""), "raw_material": user_input},
            premise={"mainline": user_input},
        )
        context = ExpertContext(
            story_direction=user_input,
            story_state=story_state.to_dict(),
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
        self._revision_count = 0
        self._repair_cycle_active = False
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

        # 触发回调
        self._trigger_callback("on_step_start", expert_id, step_index, context)

        try:
            # 构建专家特定参数
            expert_kwargs = dict(kwargs)
            contract = self.expert_state_adapter.contract(expert_id)
            task = expert_kwargs.pop("task", contract.task)
            node_ids = expert_kwargs.pop("node_ids", None)
            include_raw = bool(expert_kwargs.pop("include_raw", False))
            state = StoryState.from_dict(context.story_state) if context.story_state else StoryState()
            if expert_id in self.BULK_GENERATION_EXPERTS and not expert_kwargs.pop("bypass_generation_gate", False):
                gate = self.generation_gate.check(state)
                if not gate.passed:
                    return ExpertOutput(
                        expert_name=expert_id,
                        content="[前置门禁阻止] 立项或故事发动机未达到正文生成标准",
                        structured_data={"generation_gate": gate.to_dict()},
                        validation_passed=False,
                        validation_errors=[item.message for item in gate.issues],
                    )
            if expert_id == "§15" and not expert_kwargs.pop("bypass_signing_gate", False):
                signing_node = state.nodes.get("SYS-SIGNING-AUDIT")
                signing_data = signing_node.data if signing_node else {}
                fresh = signing_data.get("state_fingerprint") == self._signing_fingerprint(state)
                if not signing_data.get("release_ready", False) or not fresh:
                    return ExpertOutput(
                        expert_name=expert_id,
                        content="[签约门禁阻止] 项目尚未通过第五期硬门槛",
                        structured_data={"signing_gate": {**signing_data, "passed": False, "fresh": fresh, "reason": "missing_or_stale_release_audit"}},
                        validation_passed=False,
                        validation_errors=["前3集、同质化、平台、成本、故事发动机及观众体验必须全部通过"],
                    )
            if expert_id == "§9":
                audience_audit = self.audience_tracker.audit(state)
                repair_plans = self.repair_planner.build(state, audience_audit)
                if node_ids is None:
                    node_ids = sorted({plan["target"] for plan in repair_plans})
                    if "ART-AUDIT" in state.nodes:
                        node_ids.append("ART-AUDIT")
                expert_kwargs["revision_focus"] = json.dumps(
                    {"audience_audit": audience_audit.to_dict(), "repair_plans": repair_plans},
                    ensure_ascii=False,
                )
            selected_ids = self.expert_state_adapter.node_ids_for(state, expert_id, node_ids)
            context.task_context = self.context_selector.build(state, task, selected_ids, include_raw)
            expert_kwargs["_token_budgeter"] = self.token_budgeter
            expert_kwargs["_token_budget"] = self.token_budget
            
            # §9 改稿编辑需要§7审计报告
            if expert_id == "§9":
                if "§7" in self.state.step_outputs:
                    expert_kwargs["audit_report"] = self.state.step_outputs["§7"].content
                    expert_kwargs["iteration_round"] = self._revision_count + 1

            output = expert_instance.execute(context, **expert_kwargs)

            # 自动更新context
            self._update_context_from_output(expert_id, output, context)
            self.expert_state_adapter.write(state, expert_id, output)
            context.story_state = state.to_dict()

            # 触发回调
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

    @staticmethod
    def _task_for_expert(expert_id: str) -> str:
        if expert_id in {"§0", "§2", "§8"}:
            return "ideation"
        if expert_id in {"§1", "§3", "§4"}:
            return "outline"
        if expert_id in {"§11", "§6"}:
            return "scene"
        if expert_id == "§9":
            return "patch"
        return "audit"

    def apply_patch(self, patch: StoryPatch) -> Dict:
        """Apply a local change and return its exact downstream impact."""
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        context = self.state.context_snapshot
        story_state = StoryState.from_dict(context.story_state)
        record = self.patch_engine.apply(story_state, patch)
        context.story_state = story_state.to_dict()
        self._save_checkpoint()
        return asdict(record)

    def assess_project(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Persist a commissioning assessment and its evidence-backed gate result."""
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        result = ProjectEvaluator().evaluate(proposal)
        state.premise["assessment"] = dict(proposal)
        payload = {"proposal": dict(proposal), "gate": result.to_dict()}
        self._upsert_system_node(state, "SYS-ASSESSMENT", "project_assessment", payload)
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return result.to_dict()

    def configure_story_engine(self, engine: Dict[str, Any]) -> Dict[str, Any]:
        """Persist and validate the long-running story mechanism."""
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        result = StoryEngineValidator().validate(engine)
        state.engine = dict(engine)
        self._upsert_system_node(state, "SYS-STORY-ENGINE", "story_engine", {"engine": dict(engine), "gate": result.to_dict()})
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return result.to_dict()

    def check_generation_gate(self) -> Dict[str, Any]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        state = StoryState.from_dict(self.state.context_snapshot.story_state)
        return self.generation_gate.check(state).to_dict()

    def auto_develop_project(self, idea: Optional[str] = None, project: Optional[Dict[str, Any]] = None,
                             max_attempts: int = 3) -> Dict[str, Any]:
        """Assess and build the engine; never proceeds to body generation."""
        if not self.state:
            if not idea:
                raise ValueError("首次开发必须提供idea")
            self._init_workflow(idea, project_name=(project or {}).get("name", ""))
        context = self.state.context_snapshot
        actual_idea = idea or context.story_direction
        service = ProjectDevelopmentService(self.llm_client or self._get_expert_instance("§0").llm_client, max_attempts)
        result = service.develop(actual_idea, project)
        context.story_direction = result.developed_idea
        self.assess_project(result.assessment)
        if result.engine is not None:
            self.configure_story_engine(result.engine)
        return result.to_dict()

    def record_audience_experience(self, episode_id: int, node_id: str,
                                   scores: Dict[str, float], evidence: Dict[str, str],
                                   signals: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        self.audience_tracker.record(state, episode_id, node_id, scores, evidence, signals)
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return self.audience_tracker.audit(state).to_dict()

    def audit_audience_experience(self) -> Dict[str, Any]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        audit = self.audience_tracker.audit(state)
        self._upsert_system_node(state, "SYS-AUDIENCE-AUDIT", "audience_audit", audit.to_dict())
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return audit.to_dict()

    def auto_audit_audience_experience(self, node_ids: List[str]) -> Dict[str, Any]:
        """Use the configured model to score only explicit existing nodes."""
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        client = self.llm_client or self._get_expert_instance("§7").llm_client
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        audit = AudienceAuditService(client).audit_nodes(state, node_ids)
        self._upsert_system_node(state, "SYS-AUDIENCE-AUDIT", "audience_audit", audit.to_dict())
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return audit.to_dict()

    def build_quality_repair_plan(self) -> List[Dict[str, Any]]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        state = StoryState.from_dict(self.state.context_snapshot.story_state)
        return self.repair_planner.build(state, self.audience_tracker.audit(state))

    def apply_quality_repair(self, issue_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        plans = self.build_quality_repair_plan()
        plan = next((item for item in plans if item["issue_id"] == issue_id), None)
        if not plan:
            raise KeyError(f"未找到可修复问题: {issue_id}")
        record = self.apply_patch(self.repair_planner.to_patch(plan, changes))
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        for points in state.audience_curves.values():
            points[:] = [point for point in points if point.get("node_id") != plan["target"]]
        context.story_state = state.to_dict()
        self._save_checkpoint()
        record["requires_reaudit"] = True
        record["invalidated_node"] = plan["target"]
        return record

    def auto_repair_quality_issue(self, issue_id: str, reaudit: bool = True) -> Dict[str, Any]:
        """Generate and apply one node-scoped patch, then require fresh evidence."""
        plans = self.build_quality_repair_plan()
        plan = next((item for item in plans if item["issue_id"] == issue_id), None)
        if not plan:
            raise KeyError(f"未找到可修复问题: {issue_id}")
        state = StoryState.from_dict(self.state.context_snapshot.story_state)
        client = self.llm_client or self._get_expert_instance("§9").llm_client
        changes = AudienceAuditService(client).propose_repair(state, plan)
        patch_record = self.apply_quality_repair(issue_id, changes)
        result = {"patch": patch_record, "changes": changes, "reaudit": None}
        if reaudit:
            result["reaudit"] = self.auto_audit_audience_experience([plan["target"]])
        return result

    def upsert_episode(self, episode_id: int, data: Dict[str, Any], depends_on: Optional[List[str]] = None) -> Dict[str, Any]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        if episode_id < 1:
            raise ValueError("episode_id 必须大于0")
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        node_id = f"E{episode_id:02}"
        payload = dict(data)
        payload["episode_id"] = episode_id
        if node_id in state.nodes:
            state.nodes[node_id].data = payload
            state.nodes[node_id].version += 1
        else:
            state.add_node(StoryNode(node_id, "episode", payload, depends_on or []))
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return state.nodes[node_id].data

    def run_signing_audit(self, platform: str, corpus: List[Dict[str, str]],
                          cost_limits: Dict[str, int],
                          platform_profile: Optional[Dict[str, Any]] = None,
                          narrative_quality: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        context = self.state.context_snapshot
        state = StoryState.from_dict(context.story_state)
        commercial = self.signing_gate.audit(state, platform, corpus, cost_limits, platform_profile).to_dict()
        development = self.generation_gate.check(state).to_dict()
        audience = self.audience_tracker.audit(state).to_dict()
        hard_failures = list(commercial["hard_failures"])
        if not development["passed"]:
            hard_failures.append("development")
        if not audience["passed"]:
            hard_failures.append("audience_experience")
        narrative_gate = (narrative_quality or {}).get("gate")
        if narrative_gate and not narrative_gate.get("passed", False):
            hard_failures.append("narrative_quality")
        result = {
            "passed": commercial["passed"] and development["passed"] and audience["passed"] and (not narrative_gate or narrative_gate.get("passed", False)),
            "release_ready": commercial["passed"] and development["passed"] and audience["passed"] and bool(narrative_gate and narrative_gate.get("passed", False)),
            "score": round((commercial["score"] + development["score"] * 100 + audience["average"] * 10) / 3, 1),
            "hard_failures": hard_failures,
            "commercial": commercial,
            "development": development,
            "audience_experience": audience,
            "narrative_quality": narrative_quality,
            "state_fingerprint": self._signing_fingerprint(state),
        }
        self._upsert_system_node(state, "SYS-SIGNING-AUDIT", "signing_audit", result)
        context.story_state = state.to_dict()
        self._save_checkpoint()
        return result

    def auto_run_signing_audit(self, platform: str, corpus: List[Dict[str, str]],
                               cost_limits: Dict[str, int],
                               platform_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.state or not self.state.context_snapshot:
            raise RuntimeError("工作流尚未初始化")
        state = StoryState.from_dict(self.state.context_snapshot.story_state)
        client = self.llm_client or self._get_expert_instance("§15").llm_client
        narrative = SigningQualityService(client).assess(state)
        return self.run_signing_audit(platform, corpus, cost_limits, platform_profile, narrative)

    @staticmethod
    def _signing_fingerprint(state: StoryState) -> str:
        nodes = {node_id: {"kind": node.kind, "data": node.data, "version": node.version}
                 for node_id, node in sorted(state.nodes.items())
                 if node_id != "SYS-SIGNING-AUDIT"}
        payload = {"project": state.project, "premise": state.premise, "engine": state.engine,
                   "audience_curves": state.audience_curves, "nodes": nodes}
        encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    def run_acceptance_benchmark(self, baseline_tokens: int, v3_tokens: int,
                                 relevant_text_chars: int, regenerated_chars: int,
                                 evidence: str = "estimated") -> Dict[str, Any]:
        result = self.acceptance_benchmark.evaluate(
            baseline_tokens, v3_tokens, relevant_text_chars, regenerated_chars, evidence
        ).to_dict()
        if self.state and self.state.context_snapshot:
            context = self.state.context_snapshot
            state = StoryState.from_dict(context.story_state)
            self._upsert_system_node(state, "SYS-ACCEPTANCE-BENCHMARK", "acceptance_benchmark", result)
            context.story_state = state.to_dict()
            self._save_checkpoint()
        return result

    def get_token_usage_report(self) -> Dict[str, Any]:
        if not self.state:
            return self.token_usage_ledger.summarize([])
        return self.token_usage_ledger.summarize(self.state.step_outputs.values())

    @staticmethod
    def _upsert_system_node(state: StoryState, node_id: str, kind: str, data: Dict[str, Any]) -> None:
        if node_id in state.nodes:
            state.nodes[node_id].data = data
            state.nodes[node_id].version += 1
        else:
            state.add_node(StoryNode(node_id, kind, data))

    def _update_context_from_output(self, expert_id: str, output: ExpertOutput, context: ExpertContext):
        """从专家输出更新context"""
        # §0 灵魂捕手输出
        if expert_id == "§0":
            if "故事方向：" in output.content:
                import re
                dir_match = re.search(r'故事方向[：:]\s*(.+)', output.content)
                if dir_match:
                    context.story_direction = dir_match.group(1).strip()
            if "一句话前提：" in output.content:
                import re
                prem_match = re.search(r'一句话前提[：:]\s*(.+)', output.content)
                if prem_match:
                    context.story_premise = prem_match.group(1).strip()
            if "推荐类型：" in output.content:
                import re
                type_match = re.search(r'推荐类型[：:]\s*(.+)', output.content)
                if type_match:
                    if not context.project_config:
                        context.project_config = {}
                    context.project_config["drama_type"] = type_match.group(1).strip()

        # §2 合规守门员输出
        elif expert_id == "§2":
            context.risk_level = self._parse_risk_level(output.content)
            context.risk_warnings = self._parse_warnings(output.content)

        # §8 项目配置师输出
        elif expert_id == "§8":
            if "project_config" not in context.metadata:
                context.metadata["project_config"] = {}
            context.metadata["project_config"]["raw"] = output.content

        # §1 角色铸造师输出
        elif expert_id == "§1":
            cards = self._parse_character_cards(output.content)
            context.character_cards = cards

        # §4 对白大师输出
        elif expert_id == "§4":
            context.dialogue_corpus = {"raw": output.content}

        # §3 结构建筑师输出
        elif expert_id == "§3":
            beats = self._parse_beats(output.content)
            outlines = self._parse_outlines(output.content, context.project_config.get("total_episodes", 30) if context.project_config else 30)
            context.beat_table = beats
            context.episode_outlines = outlines

        # §13 视觉导演输出
        elif expert_id == "§13":
            context.visual_scheme = {"raw": output.content}

        # §6 格式工匠输出
        elif expert_id == "§6":
            context.metadata["format_report"] = output.content

        # §7 质量审计输出
        elif expert_id == "§7":
            context.metadata["quality_audit"] = output.content

        # §9 改稿编辑输出
        elif expert_id == "§9":
            context.metadata["revision_report"] = output.content

        # §11 场景工匠输出
        elif expert_id == "§11":
            context.metadata["scene_design"] = output.content

        # §14 商业操盘输出
        elif expert_id == "§14":
            context.metadata["business_report"] = output.content

        # §15 品控总监输出
        elif expert_id == "§15":
            context.metadata["final_verdict"] = output.content

    def _check_quality_gate(self, expert_id: str, output: ExpertOutput) -> Dict:
        """检查质量门禁"""
        supervision = output.structured_data.get("collaboration_supervision")
        if supervision and supervision.get("action") == "escalate":
            result = {
                "passed": False,
                "action": "pause",
                "reason": supervision.get("reason", "监督层要求人工处理"),
                "details": supervision,
            }
            self._trigger_callback("on_quality_gate", expert_id, result)
            return result
        generation_gate = output.structured_data.get("generation_gate")
        if generation_gate and not generation_gate.get("passed", False):
            result = {
                "passed": False,
                "action": "pause",
                "reason": "正文生成前置门禁未通过",
                "details": generation_gate,
            }
            self._trigger_callback("on_quality_gate", expert_id, result)
            return result
        signing_gate = output.structured_data.get("signing_gate")
        if signing_gate and not signing_gate.get("passed", False):
            result = {"passed": False, "action": "pause", "reason": "签约硬门禁未通过", "details": signing_gate}
            self._trigger_callback("on_quality_gate", expert_id, result)
            return result
        if expert_id not in self.QUALITY_GATES:
            return {"passed": True}

        gate = self.QUALITY_GATES[expert_id]
        result = {"passed": True, "gate": gate}

        if expert_id == "§2":
            risk = self._parse_risk_level(output.content)
            if risk == "red":
                result["passed"] = False
                result["action"] = "pause"
                result["reason"] = "合规风险🔴，需人工确认"

        elif expert_id == "§7":
            if self.state and self.state.context_snapshot:
                state = StoryState.from_dict(self.state.context_snapshot.story_state)
                audience_audit = self.audience_tracker.audit(state)
                output.structured_data["audience_audit"] = audience_audit.to_dict()
                if not audience_audit.passed:
                    result["passed"] = False
                    result["action"] = "loop_to_§9"
                    result["reason"] = f"观众体验审计发现{len(audience_audit.issues)}个具体问题"
            import re
            score_match = re.search(r'加权总分.*?(\d+\.?\d*)', output.content)
            if score_match:
                total_score = float(score_match.group(1))
                if total_score < 6.0:
                    result["passed"] = False
                    result["action"] = "loop_to_§9"
                    result["reason"] = f"质量总分{total_score}低于6.0，触发改稿循环"

        elif expert_id == "§15":
            if "D级" in output.content:
                result["passed"] = False
                result["action"] = "terminate"
                result["reason"] = "品控总监D级否决"
            elif "C级" in output.content:
                result["passed"] = False
                result["action"] = "rollback"
                result["reason"] = "品控总监C级打回，需大幅修改"

        self._trigger_callback("on_quality_gate", expert_id, result)
        return result

    def _ensure_collaboration_plan(self, state: WorkflowState) -> None:
        """Create one inspectable decision-layer plan for the workflow."""
        if not self.enable_agent_collaboration:
            return
        if self.collaboration.plan:
            state.collaboration_trace = self.collaboration.to_dict()
            return
        context = state.context_snapshot or ExpertContext()
        plan = self.collaboration.build_plan(
            context.story_direction,
            context.project_config,
            self.expert_sequence,
            self.SEQUENCE_DESCRIPTIONS,
        )
        state.collaboration_trace = self.collaboration.to_dict()
        self._trigger_callback("on_decision_plan", plan.to_dict())

    def _execute_with_supervision(self, step_index: int, context: ExpertContext, **kwargs) -> ExpertOutput:
        """Run one expert and let the supervision layer target only its invalid artifact."""
        output = self._execute_step(step_index, context, **kwargs)
        if not self.enable_agent_collaboration:
            return output
        expert_id = self.expert_sequence[step_index]
        # Hard gates are handled after execution; retrying them cannot repair missing prerequisites.
        if output.structured_data.get("generation_gate") or output.structured_data.get("signing_gate"):
            return output
        verdict = self.collaboration.supervise_output(expert_id, output)
        self._trigger_callback("on_supervision", verdict.to_dict())
        while verdict.action == "retry_responsible_expert":
            feedback = {
                "reason": verdict.reason,
                "validation_errors": verdict.evidence.get("validation_errors", []),
                "retry": verdict.retry,
            }
            self.collaboration.record(
                "feedback_dispatch",
                layer="supervision",
                target_expert=expert_id,
                feedback=feedback,
            )
            self._trigger_callback("on_feedback", expert_id, feedback)
            retry_kwargs = dict(kwargs)
            retry_kwargs["collaboration_feedback"] = json.dumps(feedback, ensure_ascii=False)
            output = self._execute_step(step_index, context, **retry_kwargs)
            verdict = self.collaboration.supervise_output(expert_id, output)
            self._trigger_callback("on_supervision", verdict.to_dict())
        if verdict.action == "escalate":
            output.structured_data["collaboration_supervision"] = verdict.to_dict()
        if self.state:
            self.state.collaboration_trace = self.collaboration.to_dict()
        return output

    def _supervise_gate(self, expert_id: str, gate_result: Dict[str, Any]) -> None:
        if not self.enable_agent_collaboration:
            return
        verdict = self.collaboration.supervise_gate(expert_id, gate_result)
        if self.state:
            self.state.collaboration_trace = self.collaboration.to_dict()
        self._trigger_callback("on_supervision", verdict.to_dict())

    @staticmethod
    def _parse_risk_level(content: str) -> str:
        if "🔴" in content:
            return "red"
        elif "🟡" in content:
            return "yellow"
        return "green"

    @staticmethod
    def _parse_warnings(content: str) -> List[Dict]:
        warnings = []
        import re
        lines = content.split('\n')
        for line in lines:
            if '→' in line and any(r in line for r in ['红线', '风险', '禁区']):
                warnings.append({"raw": line.strip(), "severity": "high" if '🔴' in line else "medium"})
        return warnings

    @staticmethod
    def _parse_character_cards(content: str) -> List[Dict]:
        import re
        cards = []
        blocks = re.split(r'角色名[：:]', content)
        for block in blocks[1:]:
            name_match = re.match(r'\s*(\S+)', block)
            if name_match:
                cards.append({"name": name_match.group(1), "raw": block.strip()})
        return cards

    @staticmethod
    def _parse_beats(content: str) -> List[Dict]:
        import re
        beats = []
        beat_nums = re.findall(r'#?\d+[.、]\s*', content)
        for i, _ in enumerate(beat_nums[:15]):
            beats.append({"beat_num": i + 1})
        return beats

    @staticmethod
    def _parse_outlines(content: str, total_episodes: int = 30) -> List[Dict]:
        import re
        outlines = []
        ep_pattern = r'【?第?\s*(\d+)\s*集[】:]?\s*(.{10,100})'
        matches = re.findall(ep_pattern, content)
        for ep_num, desc in matches:
            outlines.append({
                "episode": int(ep_num) if ep_num.isdigit() else 0,
                "description": desc.strip(),
            })
        return outlines

    def _trigger_callback(self, event: str, *args):
        """触发回调"""
        for callback in self._callbacks.get(event, []):
            try:
                callback(*args)
            except Exception:
                pass

    def on(self, event: str, callback: Callable):
        """注册回调"""
        if event in self._callbacks:
            self._callbacks[event].append(callback)

    def _save_checkpoint(self):
        """保存断点"""
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
                "revision_count": self._revision_count,
                "repair_cycle_active": self._repair_cycle_active,
                "collaboration_trace": self.collaboration.to_dict() if self.enable_agent_collaboration else self.state.collaboration_trace,
            }, f, ensure_ascii=False, indent=2)

    def _load_checkpoint(self, workflow_id: str) -> Optional[WorkflowState]:
        """加载断点"""
        checkpoint_path = os.path.join(self.project_path, f"{workflow_id}.checkpoint.json")
        if not os.path.exists(checkpoint_path):
            return None
        with open(checkpoint_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        context = ExpertContext(**data.get("context", {}))
        outputs = {k: ExpertOutput(**v) for k, v in data.get("step_outputs", {}).items()}
        state = WorkflowState(
            workflow_id=data["workflow_id"],
            status=WorkflowStatus(data["status"]),
            current_step=data["current_step"],
            expert_sequence=data["expert_sequence"],
            completed_steps=data["completed_steps"],
            context_snapshot=context,
            step_outputs=outputs,
            collaboration_trace=data.get("collaboration_trace", {}),
        )
        self._revision_count = data.get("revision_count", 0)
        self._repair_cycle_active = bool(data.get("repair_cycle_active", False))
        if self.enable_agent_collaboration:
            self.collaboration.restore(data.get("collaboration_trace"))
        return state

    def run_full(self, user_input: str, stop_at: Optional[str] = None, **kwargs) -> WorkflowState:
        """
        运行完整工作流

        Args:
            user_input: 用户初始输入（故事方向）
            stop_at: 可选，在指定专家处停止
            **kwargs: 传递给各专家的额外参数

        Returns:
            WorkflowState: 最终工作流状态
        """
        requested_workflow_id = kwargs.pop("workflow_id", None)
        requested_project_config = kwargs.pop("project_config", None)
        preserve_state = bool(kwargs.pop("preserve_state", False))
        # 初始化
        state = self.state if preserve_state and self.state else self._init_workflow(user_input)
        if requested_workflow_id:
            state.workflow_id = requested_workflow_id
        if requested_project_config:
            state.context_snapshot.project_config.update(requested_project_config)
        state.status = WorkflowStatus.RUNNING
        self._ensure_collaboration_plan(state)

        # 执行序列
        self._cancel_requested = False
        self._cancel_reason = None
        step_idx = 0
        while step_idx < len(self.expert_sequence):
            if self._cancel_requested or state.status == WorkflowStatus.CANCELED:
                state.status = WorkflowStatus.CANCELED
                state.error_message = self._cancel_reason or "用户取消"
                self._save_checkpoint()
                break
            expert_id = self.expert_sequence[step_idx]

            if stop_at and expert_id == stop_at:
                state.current_step = step_idx
                state.status = WorkflowStatus.PAUSED
                state.error_message = f"human_checkpoint:{expert_id}"
                self._save_checkpoint()
                self._trigger_callback("on_checkpoint", expert_id, step_idx, state)
                break

            state.current_step = step_idx
            output = self._execute_with_supervision(step_idx, state.context_snapshot, **kwargs)
            state.step_outputs[expert_id] = output
            if step_idx not in state.completed_steps:
                state.completed_steps.append(step_idx)

            # 质量门禁检查
            gate_result = self._check_quality_gate(expert_id, output)
            self._supervise_gate(expert_id, gate_result)
            if not gate_result.get("passed", True):
                action = gate_result.get("action", "")

                if action == "pause":
                    # A blocked generation step has not completed and must be retried after repair.
                    if gate_result.get("details") and state.completed_steps and state.completed_steps[-1] == step_idx:
                        state.completed_steps.pop()
                        state.step_outputs.pop(expert_id, None)
                    state.status = WorkflowStatus.PAUSED
                    state.error_message = gate_result.get("reason", "质量门禁未通过")
                    self._save_checkpoint()
                    break

                elif action == "loop_to_§9":
                    # 改稿循环：跳到§9，然后回到§7
                    if self._revision_count < self._max_revisions:
                        self._revision_count += 1
                        self._trigger_callback("on_revision_loop", self._revision_count)
                        # 找到§9和§7在序列中的位置
                        if "§9" in self.expert_sequence and "§7" in self.expert_sequence:
                            idx_9 = self.expert_sequence.index("§9")
                            if step_idx in state.completed_steps:
                                state.completed_steps.remove(step_idx)
                            # 监督层只把问题派给§9；§9完成后由下方逻辑返回§7复审。
                            self._repair_cycle_active = True
                            step_idx = idx_9
                            continue
                    state.status = WorkflowStatus.PAUSED
                    state.error_message = f"监督层：已完成{self._revision_count}轮定向返工，仍未通过§7，等待人工决策"
                    self._save_checkpoint()
                    self._trigger_callback("on_checkpoint", expert_id, step_idx, state)
                    break

                elif action == "rollback":
                    state.status = WorkflowStatus.FAILED
                    state.error_message = gate_result.get("reason", "品控打回")
                    break

                elif action == "terminate":
                    state.status = WorkflowStatus.FAILED
                    state.error_message = gate_result.get("reason", "品控否决")
                    break

            # 保存断点
            self._save_checkpoint()

            if expert_id == "§9" and self._repair_cycle_active and "§7" in self.expert_sequence:
                idx_7 = self.expert_sequence.index("§7")
                if idx_7 in state.completed_steps:
                    state.completed_steps.remove(idx_7)
                step_idx = idx_7
                continue

            # 返工后的§7复审通过时跳过重复§9；首次通过仍保留一次常规润色。
            if expert_id == "§7" and gate_result.get("passed", True) and self._repair_cycle_active and "§9" in self.expert_sequence:
                self._repair_cycle_active = False
                step_idx = self.expert_sequence.index("§9") + 1
                continue

            step_idx += 1

        if state.status == WorkflowStatus.RUNNING and step_idx >= len(self.expert_sequence):
            state.status = WorkflowStatus.COMPLETED
        state.updated_at = datetime.now().isoformat()
        self._trigger_callback("on_workflow_complete", state)
        return state

    def run_step(self, expert_id: str, context: Optional[ExpertContext] = None, **kwargs) -> ExpertOutput:
        """
        运行单个专家步骤（用于CLI单步执行）

        Args:
            expert_id: 专家编号（如"§0"）
            context: 可选，外部传入的context
            **kwargs: 传递给专家的参数

        Returns:
            ExpertOutput: 专家输出
        """
        if expert_id not in self.expert_sequence:
            return ExpertOutput(
                expert_name=expert_id,
                content=f"[错误] 专家{expert_id}不在当前工作流序列中",
                validation_passed=False,
                validation_errors=[f"专家{expert_id}不在序列{self.expert_sequence}中"],
            )

        step_idx = self.expert_sequence.index(expert_id)
        working_context = context or (self.state.context_snapshot if self.state else ExpertContext())
        output = self._execute_step(step_idx, working_context, **kwargs)

        # 更新本地状态
        if self.state:
            self.state.step_outputs[expert_id] = output
            self.state.context_snapshot = working_context
            self._save_checkpoint()

        return output

    def resume(self, workflow_id: str, stop_at: Optional[str] = None) -> WorkflowState:
        """从断点恢复工作流"""
        state = self._load_checkpoint(workflow_id)
        if not state:
            raise ValueError(f"未找到断点: {workflow_id}")
        if state.status == WorkflowStatus.CANCELED:
            raise ValueError(f"工作流已取消，不能恢复: {workflow_id}")
        self.state = state
        self.expert_sequence = list(state.expert_sequence)
        state.status = WorkflowStatus.RUNNING
        self._cancel_requested = False
        self._cancel_reason = None
        state.error_message = None
        self._ensure_collaboration_plan(state)

        # 从断点继续。使用与首次运行相同的监督/返工语义。
        reached_end = True
        step_idx = 0
        while step_idx < len(self.expert_sequence):
            if self._cancel_requested or state.status == WorkflowStatus.CANCELED:
                state.status = WorkflowStatus.CANCELED
                state.error_message = self._cancel_reason or "用户取消"
                self._save_checkpoint()
                reached_end = False
                break
            expert_id = self.expert_sequence[step_idx]
            if step_idx in state.completed_steps:
                step_idx += 1
                continue
            if stop_at and expert_id == stop_at:
                state.current_step = step_idx
                state.status = WorkflowStatus.PAUSED
                state.error_message = f"human_checkpoint:{expert_id}"
                self._save_checkpoint()
                self._trigger_callback("on_checkpoint", expert_id, step_idx, state)
                reached_end = False
                break
            state.current_step = step_idx
            output = self._execute_with_supervision(step_idx, state.context_snapshot)
            state.step_outputs[expert_id] = output
            if step_idx not in state.completed_steps:
                state.completed_steps.append(step_idx)
            gate_result = self._check_quality_gate(expert_id, output)
            self._supervise_gate(expert_id, gate_result)
            if not gate_result.get("passed", True):
                action = gate_result.get("action", "")
                if action == "pause":
                    if gate_result.get("details") and step_idx in state.completed_steps:
                        state.completed_steps.remove(step_idx)
                        state.step_outputs.pop(expert_id, None)
                    state.status = WorkflowStatus.PAUSED
                    state.error_message = gate_result.get("reason", "质量门禁未通过")
                    self._save_checkpoint()
                    reached_end = False
                    break
                if action == "loop_to_§9" and self._revision_count < self._max_revisions:
                    self._revision_count += 1
                    self._trigger_callback("on_revision_loop", self._revision_count)
                    if "§9" in self.expert_sequence:
                        if step_idx in state.completed_steps:
                            state.completed_steps.remove(step_idx)
                        self._repair_cycle_active = True
                        step_idx = self.expert_sequence.index("§9")
                        continue
                if action == "loop_to_§9":
                    state.status = WorkflowStatus.PAUSED
                    state.error_message = f"监督层：已完成{self._revision_count}轮定向返工，仍未通过§7，等待人工决策"
                    self._save_checkpoint()
                    self._trigger_callback("on_checkpoint", expert_id, step_idx, state)
                    reached_end = False
                    break
                if action in {"rollback", "terminate"}:
                    state.status = WorkflowStatus.FAILED
                    state.error_message = gate_result.get("reason", "监督层终止工作流")
                    reached_end = False
                    break
            self._save_checkpoint()

            if expert_id == "§9" and self._repair_cycle_active and "§7" in self.expert_sequence:
                idx_7 = self.expert_sequence.index("§7")
                if idx_7 in state.completed_steps:
                    state.completed_steps.remove(idx_7)
                step_idx = idx_7
                continue
            if expert_id == "§7" and gate_result.get("passed", True) and self._repair_cycle_active and "§9" in self.expert_sequence:
                self._repair_cycle_active = False
                step_idx = self.expert_sequence.index("§9") + 1
                continue
            step_idx += 1

        if reached_end and state.status == WorkflowStatus.RUNNING:
            state.status = WorkflowStatus.COMPLETED
        state.updated_at = datetime.now().isoformat()
        self._save_checkpoint()
        return state

    def get_progress(self) -> Dict:
        """获取当前进度"""
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
            "revision_count": self._revision_count,
            "collaboration": self.collaboration.to_dict() if self.enable_agent_collaboration else self.state.collaboration_trace,
        }

    def list_available_experts(self) -> List[Dict]:
        """列出所有可用的专家"""
        experts = []
        for expert_id, desc in self.SEQUENCE_DESCRIPTIONS.items():
            name = desc.split("：")[1] if "：" in desc else expert_id
            experts.append({
                "id": expert_id,
                "name": name,
                "description": desc,
                "in_sequence": expert_id in self.expert_sequence,
            })
        return experts


# 快捷工厂函数
def create_default_orchestrator(**kwargs) -> Orchestrator:
    """创建默认配置的工作流编排器（MVP 7步）"""
    return Orchestrator(**kwargs)


def create_full_orchestrator(**kwargs) -> Orchestrator:
    """创建完整15专家的工作流编排器（Wave2扩展）"""
    kwargs["use_full_sequence"] = True
    return Orchestrator(**kwargs)


__all__ = ["Orchestrator", "WorkflowState", "WorkflowStatus"]
