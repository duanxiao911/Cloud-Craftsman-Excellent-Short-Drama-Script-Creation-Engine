# 云匠引擎最终晋级交付版

版本：`final-1.0.0`  
Demo：部署后访问 `/demo/`（根地址自动跳转）  
API 文档：`/docs`  
机器评测入口：`/api/v1/capabilities`

## 评委 60 秒演示

1. 输入昵称并进入工作室。
2. 点击左侧“评审快速入口 → 60秒体验”。
3. 查看角色设定、剧情大纲、分集剧本以及三个检查点证据。
4. 点击右下角“Agent Run 证据”检查专家、判断、输入输出和质量记录。
5. 选择任一场景模板或风格包；真实运行时可在检查点确认、修改、编辑、恢复或取消。

60 秒体验使用预置案例，不调用模型、不消耗 Token。真实创作使用 Railway 已配置的模型环境变量。

## 晋级能力

- 17 个运行时 Agent，每个 Agent 绑定一个版本化 Skill 和检查清单。
- 决策层、执行层、监督层协作与质量反馈回路。
- 角色设定、剧情大纲、分集剧本三个人在回路检查点。
- SSE 实时执行事件、Agent Run 证据、输入输出、质量门禁与 Token 统计。
- 非遗短剧、男频爽文、校园甜宠模板及完整示例。
- Session 自动持久化，刷新后恢复输入、产物和后端工作流位置。
- 可取消、断点恢复、编辑产物，并保留已完成结果。
- 版本化风格经验包与小云雀、DramaClaw、通用 JSON 制作包导出。

## Railway 部署

将本目录作为 Railway 服务根目录部署。`railway.json` 和 `Procfile` 已配置：

```text
python -m uvicorn src.api.server:app --host 0.0.0.0 --port $PORT
```

环境变量沿用现有配置：

- `DRAMA_LLM_API_KEY`
- `DRAMA_LLM_BASE_URL=https://api.deepseek.com`
- `DRAMA_LLM_MODEL=deepseek-chat`

部署后依次检查 `/health`、`/api/v1/skills`、`/demo/`。

## 已执行验收

- 核心工作流：5/5 通过。
- API 发布面：2/2 通过。
- 浏览器端到端：11/11 通过。
- 页面未捕获 JavaScript 错误：0。
- Python `compileall`：通过。

浏览器报告位于 `tests/browser-acceptance.json`，验收截图位于 `tests/final-demo-screenshot.png`。

## 测试命令

```powershell
python tests/run_phase1_delivery.py
python -c "from tests.api_acceptance import test_release_surface,test_agents_skills_and_packs; test_release_surface(); test_agents_skills_and_packs()"
node tests/browser_acceptance.mjs
```

浏览器脚本默认使用系统 Microsoft Edge，不需要额外下载 Chromium。
