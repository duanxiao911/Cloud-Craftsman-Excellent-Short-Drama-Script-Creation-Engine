# 云匠引擎 2026-08-24 修复交付说明

本版本以 `yunjiang-engine-latest-20260819` 数据包为唯一基线，保留现有 UI 视觉，不做重设计。

## 已修复

- GitHub Pages 根入口补齐项目中心、能力中心、评审入口、Session、Agent Run 与体验曲线资源。
- GitHub Pages 不再把自身域名误判为 API；静态站默认连接 Railway，后端同源部署仍自动使用当前域名。
- 快速体验改为真正的零 Token 预置 Demo，覆盖 17 位专家、3 个人工检查点和可导出的运行证据。
- 项目中心的读取、创建、删除、导出、健康检查统一使用同一个后端地址。
- 修复空 API Key 下新版 OpenAI SDK 初始化失败的问题；无密钥测试进入确定性的 mock 模式。
- 统一 Railway 为 `railway.json` 配置，移除冲突的 `railway.toml`。
- Docker 启动与健康检查改为使用平台注入的 `$PORT`。
- Docker 构建不再排除专家知识库 Markdown；同时排除密钥、缓存、测试数据库与备份文件。
- 增加独立开发测试依赖 `requirements-dev.txt`。

## 部署

Railway 环境变量：

- `DRAMA_LLM_API_KEY`
- `DRAMA_LLM_BASE_URL=https://api.deepseek.com`
- `DRAMA_LLM_MODEL=deepseek-chat`
- `DATABASE_PATH=/app/data/yunjiang.db`

生产环境需在 Railway 为 `/app/data` 挂载持久卷，否则 SQLite 项目数据会在重新部署后丢失。

GitHub Pages 使用仓库根 `index.html`；真实运行后端默认为：

`https://reasonable-magic-production-7faf.up.railway.app`

如以后更换 Railway 域名，可在页面加载前设置 `window.YJ_ENGINE_API_BASE`，或在 localStorage 写入 `yunjiang_engine_api_base`。

## 验收结果

- Python 单元测试：108/108 通过。
- Phase 1 核心工作流：5/5 通过。
- 三层 Agent 协作 smoke：通过。
- 17 专家 UI 集成 smoke：通过。
- Railway 同源浏览器验收：16 项通过，0 项失败，0 个未捕获 JS 错误。
- GitHub Pages 静态入口验收：9 项通过，0 项失败，0 个本地资源 404。

浏览器证据：

- `tests/browser-acceptance.json`
- `tests/final-demo-screenshot.png`
- `tests/static-pages-acceptance.json`
- `tests/static-pages-fixed.png`

## 安全处理

原数据包包含带真实配置的 `.env`。修复交付包已删除该文件并只保留 `.env.example`。由于密钥曾进入可复制的数据包，仍应在模型平台立即轮换对应密钥。

