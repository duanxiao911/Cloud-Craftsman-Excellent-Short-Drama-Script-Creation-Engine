"""
专家基类

为每个专家模块提供统一接口规范：
- load_prompt(): 加载Prompt模板
- load_knowledge(): 加载知识库
- execute(): 执行专家逻辑
- validate_output(): 验证输出规范

基于《架构设计.md》§0-§15专家架构设计
"""

import os
import re
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Callable
from pathlib import Path
from src.knowledge_retriever import KnowledgeRetriever
from src.token_usage import TokenUsage
from src.artifact_schema import validate_artifact


@dataclass
class ExpertContext:
    """专家执行上下文：保存当前项目的所有中间产物"""
    project_name: str = ""
    story_direction: str = ""
    story_premise: str = ""  # 一句话前提
    project_config: Dict = field(default_factory=dict)
    character_cards: List[Dict] = field(default_factory=list)
    dialogue_corpus: Dict = field(default_factory=dict)  # 角色语料库
    beat_table: List[Dict] = field(default_factory=list)  # 节拍表
    episode_outlines: List[Dict] = field(default_factory=list)  # 集纲
    visual_scheme: Dict = field(default_factory=dict)  # 视觉方案
    risk_level: str = "green"  # green / yellow / red
    risk_warnings: List[Dict] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    # V3 canonical state. Kept as a dict here for checkpoint/API compatibility.
    story_state: Dict = field(default_factory=dict)
    task_context: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "project_name": self.project_name,
            "story_direction": self.story_direction,
            "story_premise": self.story_premise,
            "project_config": self.project_config,
            "character_cards": self.character_cards,
            "dialogue_corpus": self.dialogue_corpus,
            "beat_table": self.beat_table,
            "episode_outlines": self.episode_outlines,
            "visual_scheme": self.visual_scheme,
            "risk_level": self.risk_level,
            "risk_warnings": self.risk_warnings,
            "metadata": self.metadata,
            "story_state": self.story_state,
            "task_context": self.task_context,
        }

    def update(self, **kwargs):
        for key, val in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, val)


@dataclass
class ExpertOutput:
    """专家输出标准格式"""
    expert_name: str
    content: str = ""
    structured_data: Dict = field(default_factory=dict)
    validation_passed: bool = False
    validation_errors: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "expert_name": self.expert_name,
            "content": self.content,
            "structured_data": self.structured_data,
            "validation_passed": self.validation_passed,
            "validation_errors": self.validation_errors,
            "suggestions": self.suggestions,
        }


class PromptTemplate:
    """Prompt模板管理器"""
    def __init__(self, template_path: str):
        self.template_path = template_path
        self._raw_template: Optional[str] = None

    def load(self) -> str:
        """加载Prompt模板内容"""
        if self._raw_template is None:
            path = Path(self.template_path)
            if path.exists():
                self._raw_template = path.read_text(encoding="utf-8")
            else:
                self._raw_template = ""
        return self._raw_template

    def render(self, context: ExpertContext, **kwargs) -> str:
        """渲染Prompt模板，替换占位符"""
        template = self.load()
        # 支持从context和kwargs双向注入变量
        variables = context.to_dict()
        variables.update(kwargs)
        # 使用{var_name}格式的占位符
        for key, val in variables.items():
            placeholder = f"{{{key}}}"
            if placeholder in template:
                template = template.replace(placeholder, str(val) if val else "")
        return template

    def get_placeholders(self) -> List[str]:
        """提取模板中所有占位符"""
        template = self.load()
        return re.findall(r"\{(\w+)\}", template)


class LLMClient(ABC):
    """LLM调用封装（抽象基类）"""
    @abstractmethod
    def complete(self, prompt: str, **kwargs) -> str:
        """调用LLM生成内容"""
        pass

    @abstractmethod
    def complete_json(self, prompt: str, **kwargs) -> Dict:
        """调用LLM生成结构化JSON"""
        pass

    def get_last_usage(self) -> Optional[TokenUsage]:
        """Return provider-reported usage when available."""
        return None


class OpenAIClient(LLMClient):
    """OpenAI API兼容的LLM客户端"""
    def __init__(self, api_key: str = "", model: str = "gpt-4o", base_url: str = "https://api.openai.com/v1", temperature: float = 0.7):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.temperature = temperature
        self._client = None
        self._last_usage: Optional[TokenUsage] = None

    def _get_client(self):
        if self._client is None:
            # An empty key intentionally enables deterministic local/mock mode.
            # Newer OpenAI SDK releases validate credentials during client
            # construction, so avoid instantiating the SDK in that mode.
            if not (self.api_key or "").strip():
                return None
            try:
                import openai
                self._client = openai.OpenAI(api_key=self.api_key, base_url=self.base_url)
            except ImportError:
                # 如果没有openai库，返回mock
                self._client = None
        return self._client

    def complete(self, prompt: str, **kwargs) -> str:
        """调用LLM生成内容"""
        client = self._get_client()
        if client is None:
            return self._mock_complete(prompt)
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", self.temperature),
                max_tokens=kwargs.get("max_tokens", 4000),
            )
            usage = getattr(response, "usage", None)
            if usage:
                self._last_usage = TokenUsage(
                    prompt_tokens=int(getattr(usage, "prompt_tokens", 0) or 0),
                    completion_tokens=int(getattr(usage, "completion_tokens", 0) or 0),
                    total_tokens=int(getattr(usage, "total_tokens", 0) or 0),
                    evidence="observed",
                    model=self.model,
                )
            return response.choices[0].message.content
        except Exception as e:
            return f"[LLM调用失败: {e}] 请检查API配置"

    def complete_json(self, prompt: str, **kwargs) -> Dict:
        """调用LLM生成结构化JSON"""
        text = self.complete(prompt, **kwargs)
        try:
            # 尝试从文本中提取JSON
            json_match = re.search(r"\{[\s\S]*\}", text)
            if json_match:
                return json.loads(json_match.group())
            return json.loads(text)
        except json.JSONDecodeError:
            return {"error": "JSON解析失败", "raw_text": text}

    def _mock_complete(self, prompt: str) -> str:
        """Mock模式：用于无API环境下的测试"""
        content = f"[Mock LLM响应] 已收到Prompt，长度={len(prompt)}字符。请配置有效的API Key以获取真实LLM响应。"
        prompt_tokens = max(1, len(prompt) // 2)
        completion_tokens = max(1, len(content) // 2)
        self._last_usage = TokenUsage(prompt_tokens, completion_tokens, prompt_tokens + completion_tokens, "estimated", self.model)
        return content

    def get_last_usage(self) -> Optional[TokenUsage]:
        return self._last_usage


class ExpertBase(ABC):
    """
    专家模块基类

    所有专家模块必须实现：
    - expert_id: 专家编号（如"§0"、"§1"）
    - expert_name: 专家名称
    - knowledge_dir: 知识库目录
    - prompt_file: Prompt模板文件名

    所有专家必须实现：
    - get_system_prompt(): 返回LLM系统提示词
    - get_user_prompt(): 返回用户侧提示词（含上下文注入）
    - validate_output(): 验证输出是否符合规范
    """

    expert_id: str = ""
    expert_name: str = ""
    knowledge_dir: str = "knowledge/experts"
    prompt_file: str = ""

    def __init__(self, llm_client: Optional[LLMClient] = None, knowledge_base_path: Optional[str] = None, culture_kb=None):
        self.llm_client = llm_client or OpenAIClient()
        self.knowledge_base_path = knowledge_base_path
        self.culture_kb = culture_kb  # 中华优秀传统文化知识库（第5.5层）
        self._prompt_template: Optional[PromptTemplate] = None
        self.knowledge_retriever = KnowledgeRetriever()

    def get_prompt_template(self) -> PromptTemplate:
        """获取Prompt模板（懒加载）"""
        if self._prompt_template is None:
            if self.knowledge_base_path:
                template_path = os.path.join(self.knowledge_base_path, self.prompt_file)
            else:
                template_path = os.path.join(self.knowledge_dir, self.prompt_file)
            self._prompt_template = PromptTemplate(template_path)
        return self._prompt_template

    @abstractmethod
    def get_system_prompt(self) -> str:
        """返回专家的系统提示词（包含角色定义+核心规则）"""
        pass

    @abstractmethod
    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        """返回用户侧提示词（注入上下文+任务）"""
        pass

    @abstractmethod
    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        """验证输出是否符合专家规范，返回(是否通过, 错误列表)"""
        pass

    def load_knowledge(self) -> str:
        """加载专家知识库内容"""
        if self.knowledge_base_path:
            kb_path = os.path.join(self.knowledge_base_path, self.expert_name + ".md")
        else:
            kb_path = os.path.join(self.knowledge_dir, self.expert_name, "资料汇编.md")
        if os.path.exists(kb_path):
            return Path(kb_path).read_text(encoding="utf-8")
        return ""

    def parse_structured_output(self, content: str) -> Dict[str, Any]:
        """Convert every expert response into a stable native artifact envelope."""
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
        candidate = match.group(1) if match else content.strip()
        try:
            value = json.loads(candidate)
            if isinstance(value, dict):
                return value
            return {"items": value}
        except (json.JSONDecodeError, TypeError):
            pass

        parser_map = {
            "§1": ("parse_character_cards", "characters"),
            "§4": ("parse_dialogue_corpus", "dialogue_corpus"),
            "§11": ("parse_scene_list", "scenes"),
            "§6": ("parse_format_report", "format_report"),
            "§9": ("parse_revision_list", "revisions"),
            "§13": ("parse_visual_scheme", "visual_scheme"),
            "§14": ("parse_business_report", "business_report"),
            "§15": ("parse_final_verdict", "final_verdict"),
            "§10": ("parse_workflow_status", "workflow_status"),
        }
        if self.expert_id in parser_map:
            method_name, key = parser_map[self.expert_id]
            method = getattr(self, method_name, None)
            if method:
                return {key: method(content)}
        if self.expert_id == "§2":
            return {"risk_level": getattr(self, "parse_risk_level")(content), "warnings": getattr(self, "parse_warnings")(content)}
        if self.expert_id == "§3":
            return {"beat_table": getattr(self, "parse_beat_table")(content), "arc_tracking": getattr(self, "parse_arc_tracking")(content)}
        if self.expert_id == "§7":
            return {"scores": getattr(self, "parse_scores")(content), "total_score": getattr(self, "parse_total_score")(content)}
        if self.expert_id == "§8":
            return {"project_config": getattr(self, "parse_config")(content)}
        if self.expert_id == "§0":
            fields = {}
            for key, label in (("story_direction", "故事方向"), ("logline", "一句话前提"), ("drama_type", "推荐类型"), ("emotional_anchor", "核心情感锚点")):
                found = re.search(rf"{label}[：:]\s*(.+)", content)
                fields[key] = found.group(1).strip() if found else ""
            return fields
        return {"raw": content}

    def execute(self, context: ExpertContext, **kwargs) -> ExpertOutput:
        """执行专家逻辑：生成Prompt → 调用LLM → 验证输出"""
        output = ExpertOutput(expert_name=self.expert_name)

        # 1. 构建用户Prompt
        user_prompt = self.get_user_prompt(context, **kwargs)

        # 2. 构建完整Prompt（含系统提示词）
        system_prompt = self.get_system_prompt()
        knowledge = self.load_knowledge()
        budgeter = kwargs.pop("_token_budgeter", None)
        budget = kwargs.pop("_token_budget", None)
        output_tokens = kwargs.get("max_tokens", 4000)
        if budgeter and budget and knowledge:
            query = json.dumps(context.task_context, ensure_ascii=False) + "\n" + user_prompt
            chunks = self.knowledge_retriever.retrieve(
                knowledge, query, budget.knowledge, budgeter.estimate
            )
            output.structured_data["knowledge_retrieval"] = self.knowledge_retriever.serialize(chunks)
            knowledge = "\n\n".join(chunk.text for chunk in chunks)
        if knowledge:
            system_prompt = f"{system_prompt}\n\n=== 专家知识库 ===\n{knowledge}"

        # 注入中华优秀传统文化知识库（第5.5层）
        if self.culture_kb:
            culture_summary = self.culture_kb.get_summary()
            system_prompt = f"{system_prompt}\n\n=== 中华优秀传统文化知识库（第5.5层） ===\n{culture_summary}\n\n调用方式：根据当前故事类型和主题，从文化知识库中提取相关元素融入创作。文化不是展示是叙事动力——仪式的荒诞推动觉醒，节令的更替推动转折，禁忌的存在推动冲突。"

        # Versioned style packs are backend constraints, not a UI prompt suffix.
        style_pack = context.project_config.get("style_pack", {}) if context.project_config else {}
        if style_pack:
            global_rules = style_pack.get("global_rules", [])
            expert_rules = style_pack.get("expert_directives", {}).get(self.expert_id, [])
            rules = list(global_rules) + list(expert_rules)
            if rules:
                rendered = "\n".join(f"{index + 1}. {rule}" for index, rule in enumerate(rules))
                system_prompt = (
                    f"{system_prompt}\n\n=== 风格经验包（硬约束） ===\n"
                    f"{style_pack.get('name', style_pack.get('id', '未命名'))} "
                    f"v{style_pack.get('version', '1.0.0')}\n{rendered}\n"
                    "若风格规则与合规、事实或用户明确要求冲突，以后者为准。"
                )
                output.structured_data["style_pack"] = {
                    "id": style_pack.get("id"), "version": style_pack.get("version"),
                    "checksum": style_pack.get("checksum"), "rules_applied": len(rules),
                }

        full_prompt = f"{system_prompt}\n\n=== 用户输入 ===\n{user_prompt}"

        if budgeter and budget:
            report = budgeter.preflight(
                self.get_system_prompt(), knowledge, user_prompt, output_tokens, budget
            )
            output.structured_data["token_budget"] = report.__dict__

        # 3. 调用LLM
        output.content = self.llm_client.complete(full_prompt, max_tokens=output_tokens)
        usage = self.llm_client.get_last_usage()
        if usage is None:
            estimator = budgeter.estimate if budgeter else lambda text: max(1, len(text) // 2)
            prompt_tokens = estimator(full_prompt)
            completion_tokens = estimator(output.content)
            usage = TokenUsage(prompt_tokens, completion_tokens, prompt_tokens + completion_tokens, "estimated")
        output.structured_data["token_usage"] = usage.to_dict()

        # 4. 验证输出
        passed, errors = self.validate_output(output.content)
        output.validation_passed = passed
        output.validation_errors = errors
        artifact = self.parse_structured_output(output.content)
        schema_errors = validate_artifact(self.expert_id, artifact)
        native_json = output.content.lstrip().startswith("{") or output.content.lstrip().startswith("```json")
        if native_json and not schema_errors:
            output.validation_passed = True
            output.validation_errors = []
        if schema_errors:
            output.validation_passed = False
            output.validation_errors.extend(schema_errors)
        output.structured_data.update({
            "artifact_schema_version": "1.0",
            "expert_id": self.expert_id,
            "artifact": artifact,
            "artifact_schema_valid": not schema_errors,
        })

        return output

    def format_output(self, content: str) -> str:
        """格式化输出（供子类重写）"""
        return content


class ExpertRegistry:
    """专家注册表"""
    _experts: Dict[str, type] = {}

    @classmethod
    def register(cls, expert_id: str, expert_class: type):
        cls._experts[expert_id] = expert_class

    @classmethod
    def get(cls, expert_id: str) -> Optional[type]:
        return cls._experts.get(expert_id)

    @classmethod
    def list_all(cls) -> List[str]:
        return list(cls._experts.keys())

    @classmethod
    def create_instance(cls, expert_id: str, **kwargs) -> Optional[ExpertBase]:
        expert_class = cls.get(expert_id)
        if expert_class:
            return expert_class(**kwargs)
        return None


__all__ = [
    "ExpertContext",
    "ExpertOutput",
    "PromptTemplate",
    "LLMClient",
    "OpenAIClient",
    "ExpertBase",
    "ExpertRegistry",
]

