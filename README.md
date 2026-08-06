# 云匠 · 精品短剧剧本创作引擎

> 17专家协同 + 六阶段子智能体 —— 面向短剧创作者的AI全流程剧本生产系统

## 核心能力

- **17专家协同**：故事策划、剧本大纲、人物塑造、对白、场景、视觉、合规、质量审核等全环节专家分工协作
- **六阶段子智能体**：每个创作阶段收束时，对应子智能体自动上线——持固定验收清单逐项打分（1-10），不合格自动点名责任专家返工，复核闭环
- **189个题材标签**智能匹配，6阶段结构化面板实时反馈创作进度
- **SSE流式输出**实时可见，创作过程全程透明
- **全屏画布模式**，A4纸式无限高画布，沉浸式创作体验
- **深浅色双主题**，现代玻璃拟态UI
- 模块化可扩展架构，支持自定义API接入与知识库热更新

## 当前架构

```
drama-engine/
├── server.py              # 网关服务（Docker入口，LLM代理+SSE流式+Session管理）
├── session_manager.py     # Session持久化管理
├── session_routes.py      # Session路由
├── demo-v7.html           # 当前前端（17步专家串行生成模式）
├── src/
│   ├── api/
│   │   ├── server.py      # 完整Agent后端（WebSocket+Orchestrator）
│   │   └── cli.py         # CLI入口
│   ├── config/            # 配置管理
│   ├── engine/            # 引擎核心（评分/规则/类型适配）
│   ├── experts/           # 17个专家模块（Python实现）
│   ├── knowledge/         # 知识库加载
│   ├── export/            # 导出模块（最终组装）
│   ├── pipeline_orchestrator.py  # Pipeline串行编排
│   └── workflow/          # 工作流编排（Orchestrator）
├── knowledge/
│   ├── culture/           # 中华优秀传统文化知识库
│   └── experts/           # 专家知识库定义（16个MD）
├── tests/                 # 测试用例
└── examples/              # 示例配置
```

### 两套后端说明

| 服务 | 入口 | 用途 | Docker部署 |
|------|------|------|------------|
| **网关服务** | `server.py` | LLM代理、SSE流式、Session管理、OpenAI兼容接口 | 是（默认入口） |
| **Agent后端** | `src/api/server.py` | 完整Orchestrator工作流、WebSocket实时对话 | 否（开发/调试用） |

当前Docker/Railway部署的是**网关服务**，前端通过SSE流式接口逐步调用各专家，后端代理转发LLM请求。

### 专家清单（17个）

| 专家ID | 名称 | 职责 | 知识来源 |
|--------|------|------|----------|
| §0 | soul_catcher | 灵魂捕手：对话式追问，确认故事方向 | ✅ 外部知识库 |
| §1 | character_forger | 人物锻造师：三层四维度人设+弧光线 | ✅ 外部知识库 |
| §2 | compliance_guard | 合规守卫：红线扫描，输出风险评级 | ✅ 外部知识库 |
| §3 | structure_architect | 剧情架构师：救猫咪节拍表+23段落 | ✅ 外部知识库 |
| §4 | dialogue_master | 对白大师：语料库+对白风格卡+钩子链 | ✅ 外部知识库 |
| §5 | episode_writer | 分集编剧：大纲展开为分场剧本（编排器内置） | 📝 内嵌逻辑 |
| §6 | format_craftsman | 格式工匠：行业通用格式输出 | 📝 内嵌prompt |
| §7 | quality_auditor | 质量审计师：37项爆款漏斗审查 | ✅ 外部知识库 |
| §8 | project_configurator | 项目策划师：方向拆解为完整项目设定 | ✅ 外部知识库 |
| §9 | revision_editor | 返工编辑：质量不达标时针对性修改 | ✅ 外部知识库 |
| §10 | battle_commander | 实战指挥：端到端工作流编排+异常恢复 | ✅ 外部知识库 |
| §11 | scene_craftsman | 场景工匠：场景细节与氛围描写 | ✅ 外部知识库 |
| §13 | visual_director | 视觉导演：光影+镜头+声音系统 | ✅ 外部知识库 |
| §14 | business_operator | 商业操盘：市场分析+投放策略+变现路径 | ✅ 外部知识库 |
| §15 | quality_director | 质量总监：全集质量审计 | 📝 内嵌prompt |
| §16 | script_reviewer | 剧本审核：12维度量化商业诊断 | ✅ 外部知识库 |
| §17 | episode_outline_reviewer | 集纲审核：37项爆款漏斗逐项审查 | ✅ 外部知识库 |

**知识来源说明**：
- ✅ 外部知识库：专家的系统prompt存储在 `knowledge/experts/` 目录下的MD文件中，支持热更新
- 📝 内嵌prompt：专家的提示词直接写在Python代码中，适合规则明确、不需要频繁调整的逻辑

## 快速开始

### 方式一：Docker部署（推荐）

```bash
docker build -t drama-engine .
docker run -p 8000:8000 \
  -e LLM_API_KEY=your-api-key \
  -e LLM_BASE_URL=https://api.deepseek.com \
  -e LLM_MODEL=deepseek-chat \
  drama-engine
```

打开浏览器访问 `http://localhost:8000`。

### 方式二：本地开发

```bash
# 安装依赖
pip install -r requirements.txt

# 设置环境变量
export LLM_API_KEY=your-api-key
export LLM_BASE_URL=https://api.deepseek.com
export LLM_MODEL=deepseek-chat

# 启动网关服务
python server.py

# 或启动完整Agent后端（含WebSocket）
python -m src.api.server
```

### 前端独立使用

`demo-v7.html` 也可以在设置面板中直接填入 OpenAI 兼容的 API 配置（如 DeepSeek），无需后端即可开始创作。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LLM_API_KEY` | LLM API密钥 | （必填） |
| `LLM_BASE_URL` | LLM API地址 | `https://api.deepseek.com` |
| `LLM_MODEL` | 模型名称 | `deepseek-chat` |
| `HOST` | 监听地址 | `0.0.0.0` |
| `PORT` | 监听端口 | `8000` |
| `GATEWAY_TOKEN` | 网关访问令牌（可选，设置后前端需携带） | （空=不鉴权） |

## 技术栈

- **后端**: Python FastAPI (SSE流式返回)
- **前端**: 原生HTML/CSS/JS (零框架依赖)，CSS变量双主题
- **知识库**: Markdown结构化专家Prompt + 文化资料库
- **智能体架构**: 平台级大智能体 → 六阶段子智能体 → 17个专家skill分工
- **部署**: Docker + Railway

## 赛道

数字文化赛道 - AI+文娱


---

**🎬 在线演示**: [云匠引擎 Demo](https://duanxiao911.github.io/loop-studio-demo/) | **源码**: [duanxiao911/drama-engine](https://github.com/duanxiao911/drama-engine)

---
