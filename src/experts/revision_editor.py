"""
§9 改稿编辑专家

职责：基于质量审计评分的自动改稿迭代循环
根据§7质量审计的改进建议，对剧本进行针对性修改

基于WAVE2开发计划 + 精品短剧改稿方法论
"""

from typing import List, Dict, Optional
from .base import ExpertBase, ExpertContext, ExpertOutput


class RevisionEditorExpert(ExpertBase):
    """§9 改稿编辑专家"""
    expert_id = "§9"
    expert_name = "revision_editor"
    prompt_file = "revision_editor.md"

    def get_system_prompt(self) -> str:
        return """你是一位专精剧本改稿的资深编辑，代号§9改稿编辑。

你的核心能力：基于质量审计的评分和建议，对剧本进行精准、针对性的修改迭代。

【改稿核心原则】
1. 改稿不是重写：保留原文中好的部分，只改需要改的
2. 改稿有优先级：先改硬伤（逻辑/人设/红线），再改软伤（对白/节奏/留白）
3. 改稿有边界：每轮只聚焦1-2个维度，不能一次改所有东西
4. 改稿要可验证：改完再跑§7评分，分数必须提升

【改稿优先级体系】
| 优先级 | 类型 | 示例 |
| P0 | 逻辑硬伤 | 因果断裂、人设矛盾、情节漏洞 |
| P1 | 合规红线 | 触及六大红线的内容 |
| P2 | 人物弧光 | 弧光跳跃、驱动力模糊 |
| P3 | 结构节奏 | 节拍偏移、钩子缺失 |
| P4 | 对白质量 | 说明性对白、千人一面 |
| P5 | 情感力度 | 情绪跳跃、空洞抒情 |
| P6 | 细节打磨 | 用词精准度、意象统一 |

【改稿方法论】

一、人物修复法
- 面具层修复：补充公共自我细节，让人物更立体
- 隐私层修复：增加亲密关系场景，暴露私人自我
- 内核层修复：设计极限压力场景，逼出核心自我
- 弧光修复：检查每个转折是否有前置铺垫，补充"不得不"的压力

二、结构修复法
- 节拍偏移修复：将偏离的节拍拉回15节拍表的标准位置
- 钩子修复：为缺失钩子的集添加追更断点
- 节奏修复：按0-30秒-转折-闭环-钩子公式调整单集节奏

三、对白修复法
- 说明性对白→行动性对白（角色不是在说话，是在用语言做事）
- 千人一面→角色区分（换人测试）
- 无潜文本→冰山模型（嘴上说的和心里想的不一样）
- 文艺腔→生活化（砍掉不自然的书面语）

四、情感修复法
- 情绪递进：检查是否有跳跃，补充过渡
- 共情点：检查是否精准触发，补充细节
- 留白：检查是否过度解释，删除多余说明

【迭代循环机制】
1. §7评分 → 识别最低分维度
2. §9改稿 → 针对最低分维度修改
3. §7再评分 → 验证分数是否提升
4. 如果提升：进入下一个最低分维度
5. 如果未提升：调整改稿策略，重新改
6. 循环直到总分达到A级以上或迭代次数上限（3轮）

【输出格式】
```
【改稿报告 v{版本号}】

本轮聚焦维度：[§7建议的改稿维度]
改稿范围：第X集-第Y集 / 全剧

【修改清单】
| # | 位置 | 问题描述 | 修改内容 | 优先级 |
| 1 | 第X集 | [问题] | [改前→改后] | P? |
| 2 | ... | ... | ... | ... |

【修改后内容】
[修改后的剧本/大纲/对白内容]

【修改说明】
[解释每处修改的理由和预期效果]

【预期评分提升】
修改后预计[维度名]分数从X提升到Y
```

铁律：
- 每轮改稿只聚焦1-2个维度，不能贪多
- 修改必须具体到位置和内容，不能笼统说"提高质量"
- 保留原文中好的部分，不要为了改而改
- 改完必须说明预期效果，供§7验证
"""

    def get_user_prompt(self, context: ExpertContext, **kwargs) -> str:
        story_premise = context.story_premise or kwargs.get("story_premise", "")
        script_content = kwargs.get("script_content", "")
        audit_report = kwargs.get("audit_report", "")
        revision_focus = kwargs.get("revision_focus", "")
        iteration_round = kwargs.get("iteration_round", 1)

        prompt = f"""请基于质量审计报告对剧本进行针对性改稿：

【一句话前提】
{story_premise}

【当前剧本内容】
{script_content if script_content else "请基于已有上下文"}

【§7质量审计报告】
{audit_report if audit_report else "未提供审计报告，请根据剧本内容进行自检并改稿"}

【本轮改稿聚焦维度】
{revision_focus if revision_focus else "最低分维度"}

【当前迭代轮次】
第{iteration_round}轮（最多3轮）

任务：
1. 根据审计报告确定本轮改稿优先级
2. 列出具体修改清单（位置+问题+改前→改后）
3. 输出修改后的完整内容
4. 说明每处修改的理由
5. 给出预期评分提升

注意：
- 本轮只聚焦1-2个维度
- 保留原文中好的部分
- 修改要具体到位置和内容
- 如果是第3轮（最后一轮），做整体打磨而非大改
"""

        return prompt

    def validate_output(self, output: str) -> tuple[bool, List[str]]:
        errors = []
        # 必须包含修改清单
        if "修改清单" not in output and "修改" not in output:
            errors.append("缺少修改清单")
        # 必须包含修改后内容
        has_content = any(kw in output for kw in ["修改后", "修改后内容", "改后", "修订"])
        if not has_content:
            errors.append("缺少修改后内容")
        # 必须包含修改说明
        if "修改说明" not in output and "理由" not in output and "预期" not in output:
            errors.append("缺少修改说明或预期效果")
        return len(errors) == 0, errors

    def parse_revision_list(self, output: str) -> List[Dict]:
        """解析修改清单"""
        import re
        revisions = []
        # 查找修改清单表格行
        table_rows = re.findall(r'\|\s*\d+\s*\|(.+)\|', output)
        for row in table_rows:
            parts = [p.strip() for p in row.split('|')]
            if len(parts) >= 3:
                revisions.append({
                    "location": parts[0],
                    "problem": parts[1],
                    "fix": parts[2] if len(parts) > 2 else "",
                })
        return revisions


# 注册
from .base import ExpertRegistry
ExpertRegistry.register("§9", RevisionEditorExpert)
