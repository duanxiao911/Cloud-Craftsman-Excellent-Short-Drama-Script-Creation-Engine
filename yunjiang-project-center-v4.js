// ========== 云匠引擎 GitHub Pages 静态展示版 ==========
// 静态模式标记：启用模拟演示（无后端 API）
var __YJ_STATIC_MODE = true;

// 预计算演示数据（基于真实引擎产出）
var __YJ_MOCK_AGENTS = [
  { id: "\u00a73", name: "\u7ed3\u6784\u5efa\u7b51\u5e08", icon: "\ud83c\udfd7\ufe0f",
    result: "\u3010\u6545\u4e8b\u5927\u7eb2 \u00b7 \u7ed3\u6784\u5efa\u7b51\u5e08\u8f93\u51fa\u3011\n\n\u6545\u4e8b\u540d\u79f0\uff1a\u300a\u6697\u6d41\u300b\n\u7c7b\u578b\uff1a\u7537\u9891\u73b0\u5b9e\u5411 / \u5546\u6218\u9006\u88ad\n\u96c6\u6570\uff1a8\u96c6\n\n\u6838\u5fc3\u8bbe\u5b9a\uff1a\n\u4e3b\u89d2\u9648\u9ed8\uff0c28\u5c81\uff0c\u5e95\u5c42\u5feb\u9012\u5458\uff0c\u56e0\u4e00\u6b21\u5076\u7136\u673a\u4f1a\u5377\u5165\u8de8\u5883\u7535\u5546\u7070\u8272\u4ea7\u4e1a\u94fe\u3002\n\n\u4e09\u5e55\u7ed3\u6784\uff1a\n\u7b2c\u4e00\u5e55\uff081-2\u96c6\uff09\uff1a\u5feb\u9012\u5458\u610f\u5916\u83b7\u5f97\u4f9b\u5e94\u94fe\u6570\u636e\uff0c\u88ab\u8feb\u505a\u51fa\u9009\u62e9\u3002\n\u7b2c\u4e8c\u5e55\uff083-6\u96c6\uff09\uff1a\u5229\u7528\u4fe1\u606f\u5dee\u5efa\u7acb\u6e20\u9053\uff0c\u906d\u9047\u5de8\u5934\u6253\u538b\u548c\u5185\u90e8\u80cc\u53db\u3002\n\u7b2c\u4e09\u5e55\uff087-8\u96c6\uff09\uff1a\u7edd\u5730\u53cd\u51fb\uff0c\u7528\u5408\u89c4\u65b9\u5f0f\u74e6\u89e3\u7070\u8272\u94fe\u6761\u3002\n\n\u6838\u5fc3\u51b2\u7a81\uff1a\u4e2a\u4eba\u91ce\u5fc3 vs \u5546\u4e1a\u4f26\u7406"
  },
  { id: "\u00a71", name: "\u4eba\u7269\u953b\u9020\u5e08", icon: "\ud83c\udfad",
    result: "\u3010\u4eba\u7269\u5c0f\u4f20 \u00b7 \u4eba\u7269\u953b\u9020\u5e08\u8f93\u51fa\u3011\n\n\u25a0 \u9648\u9ed8\uff08\u4e3b\u89d2\uff09\n28\u5c81 | \u5feb\u9012\u5458\u2192\u8de8\u5883\u7535\u5546\u521b\u4e1a\u8005\n\u6027\u683c\uff1a\u8868\u9762\u6c89\u9ed8\uff0c\u5185\u5fc3\u6e34\u671b\u8bc1\u660e\u81ea\u5df1\u3002\n\u5f27\u5149\uff1a\u4ece\u88ab\u52a8\u5377\u5165\u5230\u4e3b\u52a8\u638c\u63a7\uff0c\u6700\u7ec8\u5b88\u4f4f\u5e95\u7ebf\u3002\n\n\u25a0 \u6797\u8587\uff08\u5973\u4e3b/\u5bf9\u624b\uff09\n27\u5c81 | \u8de8\u5883\u7535\u5546\u516c\u53f8\u8fd0\u8425\u603b\u76d1\n\u524d\u5973\u53cb\uff0c\u73b0\u4e3a\u7ade\u4e89\u5bf9\u624b\u6838\u5fc3\u4eba\u7269\u3002\n\n\u25a0 \u8001\u5468\uff08\u5bfc\u5e08\uff09\n45\u5c81 | \u8de8\u5883\u7269\u6d41\u8001\u677f\n\u5f15\u8def\u4eba+\u8b66\u793a\u955c\uff0c\u4ee3\u8868\u9648\u9ed8\u53ef\u80fd\u53d8\u6210\u7684\u6837\u5b50\u3002"
  },
  { id: "\u00a75", name: "\u96c6\u7f16\u5267", icon: "\ud83d\udccb",
    result: "\u3010\u96c6\u7eb2 \u00b7 \u96c6\u7f16\u5267\u8f93\u51fa\u3011\n\n\u2501\u2501\u2501 \u7b2c1\u96c6\uff1a\u610f\u5916\u4e4b\u8d22 \u2501\u2501\u2501\n\n\u573a\u666f1\uff1a\u4ed3\u5e93\uff08\u65e5/\u5185\uff09\n\u9648\u9ed8\u9001\u5feb\u9012\u5230\u8de8\u5883\u7269\u6d41\u4ed3\u5e93\uff0c\u65e0\u610f\u4e2d\u770b\u5230\u4e00\u4efd\u88ab\u4e22\u5f03\u7684\u4f9b\u5e94\u94fe\u6e05\u5355\u3002\n\n\u573a\u666f2\uff1a\u51fa\u79df\u5c4b\uff08\u591c/\u5185\uff09\n\u9648\u9ed8\u7814\u7a76\u6e05\u5355\uff0c\u53d1\u73b0\u4ef7\u503c\u6570\u5343\u4e07\u7684\u5957\u5229\u7a7a\u95f4\u3002\n\n\u573a\u666f3\uff1a\u8857\u8fb9\u5927\u6392\u6863\uff08\u591c/\u5916\uff09\n\u8001\u5468\u4e3b\u52a8\u627e\u4e0a\u9648\u9ed8\uff0c\u63d0\u51fa\u5408\u4f5c\u3002\n\n\u3010\u94a9\u5b50\u3011\u9648\u9ed8\u770b\u7740\u8001\u5468\u7684\u540d\u7247\u3002\u624b\u673a\u540c\u65f6\u54cd\u8d77\u2014\u2014\u662f\u6797\u8587\u6253\u6765\u7684\u3002\n\n\u2501\u2501\u2501 \u7b2c2\u96c6\uff1a\u5165\u5c40 \u2501\u2501\u2501\n\n\u573a\u666f1\uff1a\u6797\u8587\u529e\u516c\u5ba4\uff08\u65e5/\u5185\uff09\n\u6797\u8587\u53d1\u73b0\u4f9b\u5e94\u94fe\u6570\u636e\u5f02\u5e38\uff0c\u5f00\u59cb\u8c03\u67e5\u3002\n\n\u3010\u94a9\u5b50\u3011\u8c03\u67e5\u62a5\u544a\u4e0a\u51fa\u73b0\u4e86\u4e00\u4e2a\u719f\u6089\u7684\u7535\u8bdd\u53f7\u7801\u3002"
  },
  { id: "\u00a74", name: "\u5bf9\u8bdd\u5927\u5e08", icon: "\ud83d\udcac",
    result: "\u3010\u6b63\u6587\u5267\u672c \u00b7 \u5bf9\u8bdd\u5927\u5e08\u8f93\u51fa\u3011\n\n\u2501\u2501\u2501 \u7b2c1\u96c6\uff1a\u610f\u5916\u4e4b\u8d22 \u2501\u2501\u2501\n\n\u573a\u666f1\uff1a\u8de8\u5883\u7269\u6d41\u4ed3\u5e93 \u00b7 \u65e5 \u00b7 \u5185\n\n[\u73af\u5883\u97f3\uff1a\u53c9\u8f66\u58f0\u3001\u626b\u7801\u67aa\u6ef4\u6ef4\u58f0\u3001\u80f6\u5e26\u6495\u88c2\u58f0]\n\n\u9648\u9ed8\u7a7f\u7740\u5feb\u9012\u5de5\u670d\uff0c\u63a8\u7740\u5c0f\u63a8\u8f66\u7a7f\u8fc7\u8d27\u67b6\u4e4b\u95f4\u7684\u7a84\u9053\u3002\n\n\u9648\u9ed8\n\uff08\u5bf9\u7740\u626b\u7801\u67aa\uff09\n\u5c3e\u53f73347\uff0c\u7b7e\u6536\u3002\n\n\u4ed6\u5f2f\u8170\u4ece\u8d27\u67b6\u5e95\u5c42\u62bd\u51fa\u4e00\u4e2a\u7834\u635f\u7684\u7eb8\u7bb1\u3002\u4e00\u5f20A4\u7eb8\u4ece\u7f1d\u9699\u91cc\u6ed1\u51fa\u6765\u3002\n\n\u9648\u9ed8\u6361\u8d77\u7eb8\u3002\u89c6\u7ebf\u88ab\u4e00\u884c\u6570\u5b57\u9489\u4f4f\u3002\n\n\u9648\u9ed8\n\uff08\u4f4e\u58f0\u5ff5\uff09\n"FOB\u6df1\u5733\u2026\u2026\u5355\u4ef70.3\u7f8e\u5143\u2026\u2026"\n\n\u9648\u9ed8\n"\u2026\u2026\u7ec8\u7aef\u96f6\u552e\u5747\u4ef7\u2026\u20264.7\u7f8e\u5143\uff1f"\n\n\u4ed6\u7684\u624b\u505c\u4f4f\u4e86\u3002[\u6c89\u9ed8\u4e24\u79d2]"
  }
];

/**
 * 云匠智能精品短剧引擎 - 项目中心模块
 * 注入导航系统、首页、我的项目、成果中心
 */
(function() {
  'use strict';

  // ========== 常量与配置 ==========
  const STATUS_MAP = {
    draft: { label: '草稿', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    creating: { label: '创作中', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    waiting_user: { label: '等待确认', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    running: { label: 'Agent执行中', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    paused: { label: '暂停', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    failed: { label: '失败', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    completed: { label: '已完成', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
  };

  const STAGE_NAMES = [
    '创意总监', '策划', '编剧一', '编剧二', '编剧三',
    '导演一', '导演二', '制片人A', '制片人B', '制片人C',
    'IP总监A', 'IP总监B', 'IP总监C', '质检总监A', '质检总监B',
    '实战指挥', '商业操盘'
  ];

  // ========== 状态变量 ==========
  let currentView = 'home';
  let projectList = [];
  let currentProject = null;
  let userId = 'demo_001';

  try {
    const stored = localStorage.getItem('yj_user_id');
    if (stored) userId = stored;
  } catch(e) {}

  // ========== 样式注入 ==========
  function injectStyles() {
    const css = `
      /* ========== 导航栏 ========== */
      .yj-project-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        background: rgba(255,255,255,0.72);
        backdrop-filter: blur(20px) saturate(1.6);
        -webkit-backdrop-filter: blur(20px) saturate(1.6);
        border-bottom: 1px solid rgba(148,163,184,0.12);
        box-shadow: 0 1px 12px rgba(0,0,0,0.04);
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        transition: all 0.3s ease;
      }
      [data-theme="dark"] .yj-project-navbar {
        background: rgba(17,24,39,0.78);
        border-bottom-color: rgba(139,92,246,0.12);
        box-shadow: 0 1px 12px rgba(0,0,0,0.2);
      }
      .yj-project-navbar-brand {
        font-size: 17px;
        font-weight: 700;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6, #f59e0b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 0.5px;
      }
      .yj-project-navbar-nav {
        display: flex;
        gap: 4px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .yj-project-navbar-nav li { list-style: none; }
      .yj-project-navbar-nav a {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 7px 16px;
        border-radius: 10px;
        font-size: 13.5px;
        font-weight: 500;
        color: #475569;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      [data-theme="dark"] .yj-project-navbar-nav a { color: #94a3b8; }
      .yj-project-navbar-nav a:hover {
        background: rgba(139,92,246,0.08);
        color: #8b5cf6;
      }
      .yj-project-navbar-nav a.yj-nav-active {
        background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.1));
        color: #8b5cf6;
        font-weight: 600;
      }
      [data-theme="dark"] .yj-project-navbar-nav a.yj-nav-active {
        background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15));
        color: #a78bfa;
      }
      .yj-project-navbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .yj-project-new-btn {
        padding: 7px 18px;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 2px 10px rgba(139,92,246,0.25);
      }
      .yj-project-new-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(139,92,246,0.35);
      }

      /* ========== 页面容器 ========== */
      .yj-project-page {
        display: none;
        padding-top: 72px;
        min-height: 100vh;
        box-sizing: border-box;
      }
      .yj-project-page.yj-page-active { display: block; }

      /* ========== 首页 ========== */
      .yj-project-home {
        max-width: 900px;
        margin: 0 auto;
        padding: 60px 28px 80px;
        text-align: center;
      }
      .yj-project-home-badge {
        display: inline-block;
        padding: 5px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.08));
        color: #8b5cf6;
        margin-bottom: 20px;
        letter-spacing: 0.5px;
      }
      .yj-project-home h1 {
        font-size: 42px;
        font-weight: 800;
        line-height: 1.25;
        margin: 0 0 14px;
        background: linear-gradient(135deg, #1e293b 0%, #475569 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      [data-theme="dark"] .yj-project-home h1 {
        background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 50%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .yj-project-home .yj-subtitle {
        font-size: 18px;
        color: #64748b;
        margin-bottom: 40px;
        font-weight: 400;
      }
      [data-theme="dark"] .yj-project-home .yj-subtitle { color: #94a3b8; }
      .yj-project-home-actions {
        display: flex;
        justify-content: center;
        gap: 14px;
        margin-bottom: 60px;
        flex-wrap: wrap;
      }
      .yj-home-btn {
        padding: 13px 32px;
        border-radius: 14px;
        border: none;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .yj-home-btn-primary {
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        color: #fff;
        box-shadow: 0 4px 20px rgba(139,92,246,0.3);
      }
      .yj-home-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 28px rgba(139,92,246,0.4);
      }
      .yj-home-btn-secondary {
        background: rgba(139,92,246,0.08);
        color: #8b5cf6;
        border: 1px solid rgba(139,92,246,0.2);
      }
      .yj-home-btn-secondary:hover { background: rgba(139,92,246,0.14); }
      .yj-home-btn-ghost {
        background: transparent;
        color: #64748b;
        border: 1px solid rgba(148,163,184,0.25);
      }
      [data-theme="dark"] .yj-home-btn-ghost {
        color: #94a3b8;
        border-color: rgba(148,163,184,0.2);
      }
      .yj-home-btn-ghost:hover { background: rgba(148,163,184,0.08); }
      .yj-project-home-divider {
        font-size: 13px;
        color: #94a3b8;
        margin-bottom: 32px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .yj-project-home-divider::before,
      .yj-project-home-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent);
      }
      .yj-project-home-features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 14px;
        max-width: 760px;
        margin: 0 auto;
      }
      .yj-feature-card {
        padding: 20px 14px;
        border-radius: 14px;
        background: rgba(255,255,255,0.7);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(148,163,184,0.1);
        text-align: center;
        transition: all 0.25s ease;
      }
      [data-theme="dark"] .yj-feature-card {
        background: rgba(30,41,59,0.5);
        border-color: rgba(139,92,246,0.1);
      }
      .yj-feature-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        border-color: rgba(139,92,246,0.25);
      }
      .yj-feature-icon { font-size: 26px; margin-bottom: 8px; }
      .yj-feature-label {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
      }
      [data-theme="dark"] .yj-feature-label { color: #e2e8f0; }

      /* ========== 我的项目 ========== */
      .yj-project-list-wrap {
        max-width: 960px;
        margin: 0 auto;
        padding: 30px 28px 80px;
      }
      .yj-project-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
      }
      .yj-project-list-header h2 {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      [data-theme="dark"] .yj-project-list-header h2 { color: #f1f5f9; }
      .yj-project-empty {
        text-align: center;
        padding: 80px 20px;
        color: #94a3b8;
      }
      .yj-project-empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.6; }
      .yj-project-empty-text { font-size: 15px; margin-bottom: 24px; }
      .yj-project-card {
        padding: 22px 26px;
        border-radius: 16px;
        background: rgba(255,255,255,0.75);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(148,163,184,0.1);
        margin-bottom: 14px;
        transition: all 0.25s ease;
        cursor: default;
      }
      [data-theme="dark"] .yj-project-card {
        background: rgba(30,41,59,0.55);
        border-color: rgba(139,92,246,0.1);
      }
      .yj-project-card:hover {
        box-shadow: 0 6px 24px rgba(0,0,0,0.06);
        border-color: rgba(139,92,246,0.2);
        transform: translateY(-1px);
      }
      .yj-project-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      .yj-project-card-name {
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
        max-width: 70%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      [data-theme="dark"] .yj-project-card-name { color: #f1f5f9; }
      .yj-project-status-tag {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 8px;
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }
      .yj-project-card-meta {
        display: flex;
        gap: 20px;
        font-size: 12.5px;
        color: #64748b;
        margin-bottom: 14px;
      }
      [data-theme="dark"] .yj-project-card-meta { color: #94a3b8; }
      .yj-project-card-actions { display: flex; gap: 8px; }
      .yj-project-action-btn {
        padding: 6px 14px;
        border-radius: 8px;
        border: 1px solid rgba(148,163,184,0.18);
        background: rgba(255,255,255,0.6);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #475569;
      }
      [data-theme="dark"] .yj-project-action-btn {
        background: rgba(30,41,59,0.5);
        color: #94a3b8;
        border-color: rgba(139,92,246,0.15);
      }
      .yj-project-action-btn:hover {
        border-color: rgba(139,92,246,0.35);
        color: #8b5cf6;
        background: rgba(139,92,246,0.06);
      }
      .yj-project-action-btn.yj-btn-danger:hover {
        border-color: rgba(239,68,68,0.35);
        color: #ef4444;
        background: rgba(239,68,68,0.06);
      }
      .yj-project-action-btn.yj-btn-primary {
        background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.08));
        border-color: rgba(139,92,246,0.25);
        color: #8b5cf6;
      }
      .yj-project-progress-bar {
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: rgba(148,163,184,0.15);
        margin-bottom: 12px;
        overflow: hidden;
      }
      .yj-project-progress-fill {
        height: 100%;
        border-radius: 2px;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        transition: width 0.4s ease;
      }

      /* ========== 成果中心 ========== */
      .yj-achievements-wrap {
        max-width: 900px;
        margin: 0 auto;
        padding: 30px 28px 80px;
      }
      .yj-achievements-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .yj-achievements-header h2 {
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      [data-theme="dark"] .yj-achievements-header h2 { color: #f1f5f9; }
      .yj-ach-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .yj-ach-tab {
        padding: 8px 18px;
        border-radius: 10px;
        border: none;
        background: transparent;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s ease;
      }
      [data-theme="dark"] .yj-ach-tab { color: #94a3b8; }
      .yj-ach-tab.yj-ach-tab-active {
        background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08));
        color: #8b5cf6;
        font-weight: 600;
      }
      .yj-ach-content {
        padding: 24px;
        border-radius: 16px;
        background: rgba(255,255,255,0.75);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(148,163,184,0.1);
        min-height: 200px;
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.8;
        color: #334155;
        word-break: break-word;
      }
      [data-theme="dark"] .yj-ach-content {
        background: rgba(30,41,59,0.55);
        border-color: rgba(139,92,246,0.1);
        color: #cbd5e1;
      }
      .yj-ach-actions {
        display: flex;
        gap: 10px;
        margin-top: 18px;
        justify-content: flex-end;
      }
      .yj-ach-action-btn {
        padding: 9px 22px;
        border-radius: 10px;
        border: 1px solid rgba(139,92,246,0.2);
        background: rgba(139,92,246,0.08);
        color: #8b5cf6;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .yj-ach-action-btn:hover { background: rgba(139,92,246,0.15); }
      .yj-ach-action-btn.yj-ach-export {
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        color: #fff;
        border: none;
        box-shadow: 0 2px 10px rgba(139,92,246,0.25);
      }

      /* ========== Toast ========== */
      .yj-project-toast {
        position: fixed;
        top: 72px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        padding: 10px 24px;
        border-radius: 12px;
        background: rgba(15,23,42,0.88);
        backdrop-filter: blur(12px);
        color: #f1f5f9;
        font-size: 13px;
        font-weight: 500;
        z-index: 20000;
        opacity: 0;
        transition: all 0.35s ease;
        pointer-events: none;
      }
      .yj-project-toast.yj-toast-show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* ========== 新建项目弹窗 ========== */
      .yj-project-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 15000;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(6px);
        display: none;
        align-items: center;
        justify-content: center;
      }
      .yj-project-modal-overlay.yj-modal-show { display: flex; }
      .yj-project-modal {
        width: 480px;
        max-width: 92vw;
        padding: 32px;
        border-radius: 20px;
        background: rgba(255,255,255,0.92);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(148,163,184,0.15);
        box-shadow: 0 20px 60px rgba(0,0,0,0.12);
      }
      [data-theme="dark"] .yj-project-modal {
        background: rgba(30,41,59,0.92);
        border-color: rgba(139,92,246,0.15);
      }
      .yj-project-modal h3 {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 20px;
        color: #0f172a;
      }
      [data-theme="dark"] .yj-project-modal h3 { color: #f1f5f9; }
      .yj-project-modal input, .yj-project-modal textarea {
        width: 100%;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid rgba(148,163,184,0.2);
        background: rgba(255,255,255,0.7);
        font-size: 14px;
        color: #0f172a;
        outline: none;
        margin-bottom: 14px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      [data-theme="dark"] .yj-project-modal input,
      [data-theme="dark"] .yj-project-modal textarea {
        background: rgba(15,23,42,0.5);
        color: #f1f5f9;
        border-color: rgba(139,92,246,0.15);
      }
      .yj-project-modal input:focus, .yj-project-modal textarea:focus {
        border-color: rgba(139,92,246,0.5);
      }
      .yj-project-modal textarea { min-height: 100px; resize: vertical; }
      .yj-project-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
      }

      /* ========== 响应式 ========== */
      @media (max-width: 640px) {
        .yj-project-navbar { padding: 0 14px; height: 50px; }
        .yj-project-navbar-brand { font-size: 14px; }
        .yj-project-navbar-nav a { padding: 6px 10px; font-size: 12px; }
        .yj-project-home h1 { font-size: 28px; }
        .yj-project-home .yj-subtitle { font-size: 15px; }
        .yj-project-home-actions { flex-direction: column; align-items: center; }
        .yj-project-home-features { grid-template-columns: repeat(3, 1fr); }
        .yj-project-card-top { flex-direction: column; gap: 8px; }
        .yj-project-card-name { max-width: 100%; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ========== DOM 构建 ==========
  function injectDOM() {
    const container = document.createElement('div');
    container.id = 'yj-project-root';
    container.innerHTML = `
      <nav class="yj-project-navbar" id="yj-navbar">
        <div class="yj-project-navbar-brand">云匠引擎</div>
        <ul class="yj-project-navbar-nav">
          <li><a data-view="home" class="yj-nav-active">🏠 首页</a></li>
          <li><a data-view="projects">📂 我的项目</a></li>
          <li><a data-view="newproject">✨ 新建创作</a></li>
          <li><a data-view="quickdemo">⚡ 快速体验</a></li>
        </ul>
        <div class="yj-project-navbar-right">
          <button class="yj-project-new-btn" id="yj-nav-new-btn">+ 新建项目</button>
        </div>
      </nav>

      <div class="yj-project-page yj-page-active" id="yj-page-home">
        <div class="yj-project-home">
          <div class="yj-project-home-badge">AI Multi-Agent Creative Studio</div>
          <h1>云匠智能精品短剧引擎</h1>
          <p class="yj-subtitle">AI 多智能体精品内容创作工作台</p>
          <div class="yj-project-home-actions">
            <button class="yj-home-btn yj-home-btn-primary" id="yj-home-start">✨ 开始创作</button>
            <button class="yj-home-btn yj-home-btn-secondary" id="yj-home-projects">📂 我的项目</button>
            <button class="yj-home-btn yj-home-btn-ghost" id="yj-home-demo">⚡ 快速体验 Demo</button>
          </div>
          <div class="yj-project-home-divider">核心能力</div>
          <div class="yj-project-home-features">
            <div class="yj-feature-card">
              <div class="yj-feature-icon">🤖</div>
              <div class="yj-feature-label">6 Agents</div>
            </div>
            <div class="yj-feature-card">
              <div class="yj-feature-icon">🎯</div>
              <div class="yj-feature-label">6 Skills</div>
            </div>
            <div class="yj-feature-card">
              <div class="yj-feature-icon">🧑‍💻</div>
              <div class="yj-feature-label">Human-in-the-loop</div>
            </div>
            <div class="yj-feature-card">
              <div class="yj-feature-icon">✅</div>
              <div class="yj-feature-label">质量监督</div>
            </div>
            <div class="yj-feature-card">
              <div class="yj-feature-icon">💾</div>
              <div class="yj-feature-label">项目持久化</div>
            </div>
            <div class="yj-feature-card">
              <div class="yj-feature-icon">📦</div>
              <div class="yj-feature-label">成果导出</div>
            </div>
          </div>
        </div>
      </div>

      <div class="yj-project-page" id="yj-page-projects">
        <div class="yj-project-list-wrap">
          <div class="yj-project-list-header">
            <h2>📂 我的项目</h2>
            <button class="yj-project-new-btn" id="yj-list-new-btn">+ 新建项目</button>
          </div>
          <div id="yj-project-list"></div>
        </div>
      </div>

      <div class="yj-project-page" id="yj-page-achievements">
        <div class="yj-achievements-wrap">
          <div class="yj-achievements-header">
            <h2 id="yj-ach-title">🏆 成果中心</h2>
            <button class="yj-home-btn yj-home-btn-ghost" id="yj-ach-back">← 返回项目</button>
          </div>
          <div class="yj-ach-tabs" id="yj-ach-tabs"></div>
          <div class="yj-ach-content" id="yj-ach-content">暂无成果数据</div>
          <div class="yj-ach-actions">
            <button class="yj-ach-action-btn" id="yj-ach-copy">📋 复制内容</button>
            <button class="yj-ach-action-btn yj-ach-export" id="yj-ach-export">📦 导出完整项目</button>
          </div>
        </div>
      </div>

      <div class="yj-project-modal-overlay" id="yj-new-project-modal">
        <div class="yj-project-modal">
          <h3>✨ 新建创作项目</h3>
          <input type="text" id="yj-new-project-name" placeholder="项目名称（如：都市逆袭之巅峰人生）" />
          <textarea id="yj-new-project-idea" placeholder="描述你的短剧创意...&#10;例如：一个普通大学生意外获得超能力，在校园中经历爱情、友情与成长的故事，共5集，每集3分钟"></textarea>
          <div class="yj-project-modal-actions">
            <button class="yj-home-btn yj-home-btn-ghost" id="yj-modal-cancel">取消</button>
            <button class="yj-home-btn yj-home-btn-primary" id="yj-modal-create">开始创作</button>
          </div>
        </div>
      </div>

      <div class="yj-project-toast" id="yj-toast"></div>
    `;
    document.body.appendChild(container);
  }

  // ========== 工具函数 ==========
  function showToast(msg, duration) {
    duration = duration || 2500;
    const t = document.getElementById('yj-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('yj-toast-show');
    setTimeout(function() { t.classList.remove('yj-toast-show'); }, duration);
  }

  function getStatusInfo(status) {
    return STATUS_MAP[status] || { label: status || '未知', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
  }

  var STAGE_TO_STEP = {
    'idea': 1, 'project_config': 1, 'direction': 1,
    'compliance': 2, 'dialogue': 5, 'character': 4,
    'outline': 6, 'episode': 7, 'supervision': 9,
    'visual': 10, 'style': 11, 'market': 12,
    'emotion': 8, 'conflict': 14, 'rhythm': 16,
    'climax': 15, 'ending': 17
  };
  function stageToStep(stage) {
    if (typeof stage === 'number') return stage;
    if (typeof stage === 'string' && STAGE_TO_STEP[stage]) return STAGE_TO_STEP[stage];
    return 1;
  }
  function getStageCount(status, currentStage) {
    if (status === 'completed') return 17;
    if (status === 'draft') return 0;
    var step = stageToStep(currentStage);
    if (step > 0) return Math.min(step, 17);
    return 1;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '刚刚';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      return d.toLocaleDateString('zh-CN');
    } catch(e) {
      return dateStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ========== API 调用 ==========
  async function apiGet(path) {
    try {
      const res = await fetch(path, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      console.error('[YJ API] GET', path, e);
      return null;
    }
  }

  async function apiPost(path, body) {
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      console.error('[YJ API] POST', path, e);
      return null;
    }
  }

  async function apiDelete(path) {
    try {
      const res = await fetch(path, { method: 'DELETE' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      console.error('[YJ API] DELETE', path, e);
      return null;
    }
  }

  // ========== 视图切换 ==========
  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.yj-project-page').forEach(function(p) { p.classList.remove('yj-page-active'); });
    document.querySelectorAll('.yj-project-navbar-nav a').forEach(function(a) {
      a.classList.remove('yj-nav-active');
      if (a.dataset.view === view) a.classList.add('yj-nav-active');
    });

    switch (view) {
      case 'home':
        document.getElementById('yj-page-home').classList.add('yj-page-active');
        document.querySelector('.app-container').style.setProperty('display', 'none', 'important');
        // 恢复顶部导航和底部输入区
        var topBar = document.querySelector('.top-bar');
        if (topBar) topBar.style.setProperty('display', '', 'important');
        var bottomWrapper = document.querySelector('.bottom-interaction-wrapper');
        if (bottomWrapper) bottomWrapper.style.setProperty('display', '', 'important');
        var backBtn = document.getElementById('yj-back-btn');
        if (backBtn) backBtn.style.display = 'none';
        break;
      case 'projects':
        document.getElementById('yj-page-projects').classList.add('yj-page-active');
        document.querySelector('.app-container').style.setProperty('display', 'none', 'important');
        loadProjectList();
        // 恢复顶部导航和底部输入区
        var topBar = document.querySelector('.top-bar');
        if (topBar) topBar.style.setProperty('display', '', 'important');
        var bottomWrapper = document.querySelector('.bottom-interaction-wrapper');
        if (bottomWrapper) bottomWrapper.style.setProperty('display', '', 'important');
        var backBtn = document.getElementById('yj-back-btn');
        if (backBtn) backBtn.style.display = 'none';
        break;
      case 'achievements':
        document.getElementById('yj-page-achievements').classList.add('yj-page-active');
        document.querySelector('.app-container').style.setProperty('display', 'none', 'important');
        // 恢复顶部导航和底部输入区
        var topBar = document.querySelector('.top-bar');
        if (topBar) topBar.style.setProperty('display', '', 'important');
        var bottomWrapper = document.querySelector('.bottom-interaction-wrapper');
        if (bottomWrapper) bottomWrapper.style.setProperty('display', '', 'important');
        var backBtn = document.getElementById('yj-back-btn');
        if (backBtn) backBtn.style.display = 'none';
        break;
      case 'workspace':
        var ac = document.querySelector('.app-container');
        if (ac) { ac.style.display = ''; ac.style.setProperty('display', '', 'important'); ac.removeAttribute('style'); }
        var wsc = document.getElementById('welcomeScreen');
        if (wsc) wsc.style.display = 'none';
        // 隐藏顶部导航和底部输入区
        var topBar = document.querySelector('.top-bar');
        if (topBar) topBar.style.setProperty('display', 'none', 'important');
        var bottomWrapper = document.querySelector('.bottom-interaction-wrapper');
        if (bottomWrapper) bottomWrapper.style.setProperty('display', 'none', 'important');
        // 显示/创建返回按钮
        var backBtn = document.getElementById('yj-back-btn');
        if (!backBtn) {
          backBtn = document.createElement('button');
          backBtn.id = 'yj-back-btn';
          backBtn.textContent = '← 返回';
          backBtn.style.cssText = 'position:fixed;top:20px;left:20px;z-index:10000;padding:8px 16px;background:rgba(139,92,246,0.9);color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;backdrop-filter:blur(8px);transition:all 0.2s;';
          backBtn.onmouseover = function() { this.style.background = 'rgba(139,92,246,1)'; this.style.transform = 'translateX(-2px)'; };
          backBtn.onmouseout = function() { this.style.background = 'rgba(139,92,246,0.9)'; this.style.transform = 'translateX(0)'; };
          backBtn.onclick = function() { switchView('home'); };
          document.body.appendChild(backBtn);
        }
        backBtn.style.display = 'block';
        var oc = document.getElementById('outputContainer');
        if (oc && oc.innerHTML === '') {
          oc.innerHTML = '<div style="padding:40px;text-align:center;color:#6b7280;">工作区已就绪</div>';
        }
        break;
      case 'newproject':
        openNewProjectModal();
        document.querySelector('.app-container').style.setProperty('display', 'none', 'important');
        break;
      case 'quickdemo':
        showQuickDemo();
        break;
    }
    window.scrollTo(0, 0);
  }

  function showOriginalWelcome() {
    var appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = '';
    var ws = document.getElementById('welcomeScreen');
    if (ws) ws.style.display = '';
    
    // 清空之前的生成内容，确保极速体验显示干净的输入界面
    var outputContainer = document.getElementById('outputContainer');
    if (outputContainer) outputContainer.innerHTML = '';
    
    // 移除之前可能存在的极速体验工作区
    var oldDemoArea = document.getElementById('yj-quickdemo-area');
    if (oldDemoArea) oldDemoArea.remove();
    
    // 重置ideaInput，让用户重新输入
    var ideaInput = document.getElementById('ideaInput');
    if (ideaInput) ideaInput.value = '';
    
    // 隐藏agentAuditPanel（如果可见）
    var auditPanel = document.getElementById('agentAuditPanel');
    if (auditPanel) auditPanel.style.display = 'none';
    
    // 恢复generateBtn显示（之前可能被runQuickDemoWorkflow隐藏）
    var generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.style.display = '';
    document.querySelectorAll('.yj-project-navbar-nav a').forEach(function(a) { a.classList.remove('yj-nav-active'); });
    currentView = 'welcome';
  }

  // ========== 极速体验模式 ==========
  function showQuickDemo() {
    // 隐藏项目中心的导航和页面
    var navbar = document.getElementById('yj-project-navbar');
    if (navbar) navbar.style.display = 'none';
    document.querySelectorAll('.yj-project-page').forEach(function(p) { p.style.display = 'none'; });
    
    // 显示原始app-container和welcomeScreen
    var appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.display = '';
      appContainer.style.setProperty('display', 'grid', 'important');
    }
    var ws = document.getElementById('welcomeScreen');
    if (ws) ws.style.display = '';
    
    // 清空之前的生成内容，确保极速体验显示干净的输入界面
    var outputContainer = document.getElementById('outputContainer');
    if (outputContainer) outputContainer.innerHTML = '';
    
    // 移除之前可能存在的极速体验工作区
    var oldDemoArea = document.getElementById('yj-quickdemo-area');
    if (oldDemoArea) oldDemoArea.remove();
    
    // 重置ideaInput，让用户重新输入
    var ideaInput = document.getElementById('ideaInput');
    if (ideaInput) ideaInput.value = '';
    
    // 隐藏agentAuditPanel（如果可见）
    var auditPanel = document.getElementById('agentAuditPanel');
    if (auditPanel) auditPanel.style.display = 'none';
    
    // 恢复generateBtn显示（之前可能被runQuickDemoWorkflow隐藏）
    var generateBtn = document.getElementById("generateBtn");
    if (generateBtn) generateBtn.style.display = "";
    
    // 显式显示创作输入栏及其父容器
    var inputCard = document.querySelector(".modern-input-card");
    if (inputCard) {
        inputCard.style.setProperty("display", "flex", "important");
        inputCard.style.setProperty("visibility", "visible", "important");
        inputCard.style.setProperty("opacity", "1", "important");
    }
    var bottomWrapper = document.querySelector(".bottom-interaction-wrapper");
    if (bottomWrapper) {
        bottomWrapper.style.setProperty("display", "block", "important");
        bottomWrapper.style.setProperty("visibility", "visible", "important");
        bottomWrapper.style.setProperty("opacity", "1", "important");
    }
    
    // 修改welcomeScreen的标题，显示极速体验模式
    var title = ws ? ws.querySelector('h1') : null;
    if (title) title.textContent = '云匠引擎 · 极速体验版';
    
    var subtitle = ws ? ws.querySelector('p') : null;
    if (subtitle) subtitle.textContent = '快速生成：故事大纲 → 人物小传 → 集纲 → 正文剧本';
    
    // 添加极速体验说明
    var existingNote = ws ? ws.querySelector('.yj-quickdemo-note') : null;
    if (!existingNote && ws) {
      var note = document.createElement('div');
      note.className = 'yj-quickdemo-note';
      note.style.cssText = 'text-align:center;padding:12px 20px;margin:16px auto;max-width:500px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;color:#a78bfa;font-size:14px;';
      note.innerHTML = '⚡ 极速模式：仅运行 4 个核心 Agent（结构建筑师、人物锻造师、集编剧、对话大师），跳过其他环节';
      ws.appendChild(note);
    }
    
    // 隐藏top-bar和bottom-interaction
    var topBar = document.querySelector('.top-bar');
    if (topBar) topBar.style.setProperty('display', 'none', 'important');
    // 显示返回按钮
    var backBtn = document.getElementById('yj-back-btn');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.id = 'yj-back-btn';
      backBtn.textContent = '← 返回';
      backBtn.style.cssText = 'position:fixed;top:20px;left:20px;z-index:10000;background:rgba(139,92,246,0.9);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:14px;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 2px 8px rgba(0,0,0,0.2);transition:all 0.2s;';
      backBtn.onmouseover = function() { this.style.background='rgba(139,92,246,1)'; this.style.transform='scale(1.05)'; };
      backBtn.onmouseout = function() { this.style.background='rgba(139,92,246,0.9)'; this.style.transform='scale(1)'; };
      backBtn.onclick = function() { switchView('home'); };
      document.body.appendChild(backBtn);
    }
    backBtn.style.display = 'block';
    
    // 设置极速模式标志
    window._yjQuickDemoMode = true;
    
    // 修改"开始创作"按钮的行为
    var generateBtn = document.getElementById('generateBtn');
    if (generateBtn && !generateBtn._yjQuickDemoHooked) {
      generateBtn._yjQuickDemoHooked = true;
      var originalClick = generateBtn.onclick;
      generateBtn.onclick = function(e) {
        if (window._yjQuickDemoMode) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof applyGenresToIdea === "function") applyGenresToIdea();
          runQuickDemoWorkflow();
          return false;
        }
        if (originalClick) return originalClick.apply(this, arguments);
      };
    }
  }


  // ========== 极速体验模式 - 真实API调用 ==========
  async function runQuickDemoWorkflow() {
    var ideaInput = document.getElementById('ideaInput');
    var storyDirection = ideaInput ? ideaInput.value.trim() : '';
    if (!storyDirection) {
      showToast('请先输入你的短剧想法');
      return;
    }

    // 隐藏开始按钮，显示工作区
    var generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.style.display = 'none';
    var ws = document.getElementById('welcomeScreen');

    // 创建极速体验工作区
    var demoArea = document.createElement('div');
    demoArea.id = 'yj-quickdemo-area';
    demoArea.style.cssText = 'margin-top:24px;max-width:900px;margin-left:auto;margin-right:auto;padding:0 20px;';
    ws.appendChild(demoArea);

    // --- 状态面板 ---
    var statusPanel = document.createElement('div');
    statusPanel.id = 'yj-qd-status';
    statusPanel.style.cssText = 'background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:16px 20px;margin-bottom:20px;';
    statusPanel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
      '<span style="font-size:16px;"></span>' +
      '<strong style="color:#8b5cf6;font-size:15px;">Orchestrator 调度面板</strong>' +
      '<span id="yj-qd-status-badge" style="margin-left:auto;background:#8b5cf6;color:#fff;border-radius:20px;padding:2px 12px;font-size:12px;">初始化</span>' +
    '</div>' +
    '<div id="yj-qd-log" style="font-family:monospace;font-size:12px;color:#94a3b8;max-height:120px;overflow-y:auto;line-height:1.8;"></div>';
    demoArea.appendChild(statusPanel);

    // --- Agent 卡片 ---
    var agents = [
      { id: "§3", name: "结构建筑师", icon: "🏗️", output: "故事大纲" },
      { id: "§1", name: "人物锻造师", icon: "🎭", output: "人物小传" },
      { id: "§5", name: "集编剧", icon: "📋", output: "集纲" },
      { id: "§4", name: "对话大师", icon: "💬", output: "正文剧本" }
    ];
    var cardsArea = document.createElement('div');
    cardsArea.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;';
    cardsArea.className = 'yj-stagger';
    agents.forEach(function(a) {
      var card = document.createElement('div');
      card.id = 'yj-qd-card-' + a.id.replace('§', 's');
      card.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center;';
      card.className = 'yj-qd-card-enter';
      card.innerHTML = '<div style="font-size:28px;margin-bottom:8px;">' + a.icon + '</div>' +
        '<div style="font-weight:600;font-size:14px;color:#e2e8f0;">' + a.name + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:4px;">' + a.output + '</div>' +
        '<div class="yj-qd-badge" style="margin-top:8px;display:inline-block;background:#475569;color:#94a3b8;border-radius:20px;padding:2px 10px;font-size:11px;">等待中</div>';
      cardsArea.appendChild(card);
    });
    demoArea.appendChild(cardsArea);

    // --- 结果区域 ---
    var resultsArea = document.createElement('div');
    resultsArea.id = 'yj-qd-results';
    resultsArea.style.cssText = 'display:flex;flex-direction:column;gap:16px;';
    demoArea.appendChild(resultsArea);

    // 辅助函数
    var logEl = document.getElementById('yj-qd-log');
    var statusBadge = document.getElementById('yj-qd-status-badge');
    var results = {};
    var startTime = Date.now();

    function addLog(msg) {
      var now = new Date();
      var ts = now.toTimeString().split(' ')[0];
      if (logEl) {
        logEl.innerHTML += '<div>[' + ts + '] ' + msg + '</div>';
        logEl.scrollTop = logEl.scrollHeight;
      }
    }
    function setStatus(text, color) {
      if (statusBadge) { statusBadge.textContent = text; statusBadge.style.background = color || '#8b5cf6'; }
    }
    function setAgentStatus(agentId, text, color) {
      var card = document.getElementById('yj-qd-card-' + agentId.replace('§', 's'));
      if (!card) return;
      var badge = card.querySelector('.yj-qd-badge');
      // 清除旧状态类
      card.classList.remove('yj-qd-card-running','yj-qd-card-complete','yj-qd-card-error');
      if (text.indexOf('运行') >= 0) card.classList.add('yj-qd-card-running');
      else if (text.indexOf('完成') >= 0) card.classList.add('yj-qd-card-complete');
      else if (text.indexOf('错误') >= 0) card.classList.add('yj-qd-card-error');
      if (badge) {
        badge.textContent = text;
        badge.style.background = color || '#475569';
        badge.style.color = (color === '#22c55e' || color === '#3b82f6') ? '#fff' : '#94a3b8';
        // 徽章弹跳
        badge.classList.remove('yj-badge-pulse');
        void badge.offsetWidth;
        badge.classList.add('yj-badge-pulse');
      }
    }
    function showResult(agentId, agentName, icon, content) {
      var el = document.createElement('div');
      el.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:20px;';
      el.className = 'yj-qd-result-enter';
      var shortContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
      el.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:24px;">' + icon + '</span>' +
        '<strong style="color:#8b5cf6;font-size:15px;">' + agentName + ' · 输出</strong>' +
        '<span style="margin-left:auto;color:#22c55e;font-size:12px;">✓ 完成</span>' +
      '</div>' +
      '<div style="color:#e2e8f0;font-size:14px;line-height:1.8;white-space:pre-wrap;max-height:300px;overflow-y:auto;">' + escapeHtml(shortContent) + '</div>';
      resultsArea.appendChild(el);
    }
    function escapeHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // 开始调度
    addLog('🚀 极速模式启动，目标：4个核心Agent');
    setStatus('运行中', '#3b82f6');
    agents.forEach(function(a) { setAgentStatus(a.id, '等待中', '#475569'); });

    // === 静态展示模式（GitHub Pages，无后端） ===
    if (typeof __YJ_STATIC_MODE !== 'undefined' && __YJ_STATIC_MODE) {
      addLog('\ud83d\udccb \u9759\u6001\u5c55\u793a\u6a21\u5f0f \u00b7 \u9884\u8ba1\u7b97\u7ed3\u679c\u6f14\u793a');
      addLog('\ud83d\udccb \u4e13\u5bb6\u5e8f\u5217: \u00a73\u2192\u00a71\u2192\u00a75\u2192\u00a74');
      var mockList = __YJ_MOCK_AGENTS;
      for (var mi = 0; mi < mockList.length; mi++) {
        (function(idx) {
          setTimeout(function() {
            var ma = mockList[idx];
            addLog('\u25b6 \u8c03\u7528 ' + ma.id);
            setAgentStatus(ma.id, '\u8fd0\u884c\u4e2d', '#3b82f6');
            var et = 1800 + Math.random() * 1500;
            setTimeout(function() {
              var el = ((Date.now() - startTime) / 1000).toFixed(1);
              addLog('\u2713 ' + ma.id + ' \u5b8c\u6210 (' + el + 's)');
              setAgentStatus(ma.id, '\u2713 \u5b8c\u6210', '#22c55e');
              showResult(ma.id, ma.name || ma.id, ma.icon || '\u2705', ma.result);
              if (idx === mockList.length - 1) {
                var tt = ((Date.now() - startTime) / 1000).toFixed(1);
                setStatus('\u5df2\u5b8c\u6210', '#22c55e');
                addLog('\ud83c\udfc1 \u6781\u901f\u4f53\u9a8c\u5b8c\u6210\uff0c\u603b\u8017\u65f6 ' + tt + 's');
                addLog('\ud83d\udcca \u5171\u8c03\u7528 4/17 \u4e2aAgent\uff0c\u8282\u7701 76% \u8d44\u6e90');
                if (typeof showCompleteBanner === 'function') showCompleteBanner();
              }
            }, et);
          }, idx * 300);
        })(mi);
      }
      return;
    }


    try {
      // 1. 创建workflow
      addLog(' 调度请求 → POST /api/v1/create');
      var createRes = await apiPost('/api/v1/create', {
        story_direction: storyDirection,
        drama_type: '男频现实向',
        total_episodes: 8,
        expert_sequence: ['§3', '§1', '§5', '§4']
      });

      if (!createRes || !createRes.workflow_id) {
        addLog('❌ 创建失败：' + (createRes ? JSON.stringify(createRes) : '无响应'));
        setStatus('失败', '#ef4444');
        return;
      }

      var wfId = createRes.workflow_id;
      addLog('✅ 工作流已创建: ' + wfId);
      addLog('📋 专家序列: §3→§1→§5→§4');

      // 2. SSE 事件监听
      var evtSource = new EventSource('/api/v1/events/' + wfId);
      evtSource.onmessage = function(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === 'expert_start') {
            addLog('▶ 调用 ' + data.expert_id + ' (' + (data.task || '') + ')');
            setAgentStatus(data.expert_id, '运行中', '#3b82f6');
          } else if (data.type === 'expert_complete') {
            var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            addLog('✓ ' + data.expert_id + ' 完成 (' + elapsed + 's)');
            setAgentStatus(data.expert_id, '✓ 完成', '#22c55e');
            if (data.output) {
              results[data.expert_id] = typeof data.output === "string" ? data.output : (data.output.content || "");
              var agentInfo = agents.find(function(a) { return a.id === data.expert_id; });
              if (agentInfo) showResult(data.expert_id, agentInfo.name, agentInfo.icon, typeof data.output === "string" ? data.output : (data.output.content || ""));
            }
          } else if (data.type === 'expert_error') {
            addLog('✗ ' + data.expert_id + ' 错误: ' + (data.error || ''));
            setAgentStatus(data.expert_id, '✗ 错误', '#ef4444');
          } else if (data.type === 'workflow_state') {
            addLog('📊 状态: ' + data.status);
            if (data.status === 'completed') {
              setStatus('已完成', '#22c55e');
              evtSource.close();
              showCompleteBanner();
            } else if (data.status === 'failed') {
              setStatus('失败', '#ef4444');
              evtSource.close();
            } else if (data.status === 'paused') {
              addLog('⏸ 工作流暂停，自动恢复中...');
              setStatus('恢复中', '#f59e0b');
              fetch('/api/v1/resume/' + wfId, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
                .then(function(r) { return r.json(); })
                .then(function(r) { addLog('▶ 恢复请求已发送: ' + (r.status || 'ok')); setStatus('运行中', '#3b82f6'); })
                .catch(function(e) { addLog('❌ 恢复失败: ' + e.message); });
            }
          }
        } catch(e) {}
      };
      evtSource.onerror = function() {
        addLog(' SSE连接中断，启用轮询备用');
        evtSource.close();
        pollForResult(wfId);
      };

    } catch(e) {
      addLog('❌ 请求失败: ' + e.message);
      setStatus('失败', '#ef4444');
    }


    function showCompleteBanner() {
      var existing = document.getElementById('yj-qd-complete-banner');
      if (existing) return;
      var banner = document.createElement('div');
      banner.id = 'yj-qd-complete-banner';
      banner.className = 'yj-qd-complete-banner';
      banner.style.cssText = 'margin-top:24px;background:linear-gradient(135deg,rgba(34,197,94,0.12),rgba(139,92,246,0.12));border:1px solid rgba(34,197,94,0.3);border-radius:16px;padding:24px;text-align:center;';
      banner.innerHTML = '<div style="font-size:36px;margin-bottom:8px;">✨</div>' +
        '<strong style="color:#22c55e;font-size:18px;">四个Agent全部完成</strong>' +
        '<div style="color:#94a3b8;font-size:13px;margin-top:6px;">故事大纲 · 人物小传 · 集纲 · 正文剧本 已就绪</div>';
      var resultsArea = document.getElementById('yj-qd-results');
      if (resultsArea) resultsArea.appendChild(banner);
    }

    // 轮询备用
    async function pollForResult(wfId) {
      var maxPoll = 60;
      for (var i = 0; i < maxPoll; i++) {
        await new Promise(function(r) { setTimeout(r, 5000); });
        try {
          var res = await apiGet('/api/v1/result/' + wfId);
          if (res && res.outputs) {
            Object.keys(res.outputs).forEach(function(key) {
              if (!results[key] && res.outputs[key].content) {
                results[key] = res.outputs[key].content;
                var agentInfo = agents.find(function(a) { return a.id === key; });
                if (agentInfo) {
                  setAgentStatus(key, '✓ 完成', '#22c55e');
                  showResult(key, agentInfo.name, agentInfo.icon, res.outputs[key].content);
                }
              }
            });
            if (res.status === 'paused') {
              addLog('⏸ 工作流暂停(质量门禁)，自动恢复...');
              setStatus('恢复中', '#f59e0b');
              try {
                await fetch('/api/v1/resume/' + wfId, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                addLog('▶ 恢复成功，继续运行');
                setStatus('运行中', '#3b82f6');
              } catch(re) { addLog('❌ 恢复失败: ' + re.message); }
              continue;
            }
            if (res.status === 'completed') {
              setStatus('已完成', '#22c55e');
              var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              addLog('🏁 极速体验完成，总耗时 ' + elapsed + 's');
              addLog('📊 共调用 4/17 个Agent，节省 76% 资源');
              showCompleteBanner();
              return;
            }
          }
        } catch(e) {}
      }
      setStatus('超时', '#f59e0b');
      addLog('⏰ 轮询超时');
    }
  }

  // ========== 项目列表 ==========
  async function loadProjectList() {
    var listEl = document.getElementById('yj-project-list');
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">加载中...</div>';

    var data = await apiGet('/api/v1/projects?user_id=' + encodeURIComponent(userId));

    if (!data || (Array.isArray(data) ? data.length === 0 : (!data.projects || data.projects.length === 0))) {
      listEl.innerHTML = '<div class="yj-project-empty">' +
        '<div class="yj-project-empty-icon">📝</div>' +
        '<div class="yj-project-empty-text">还没有项目，开始你的第一个创作吧</div>' +
        '<button class="yj-home-btn yj-home-btn-primary" id="yj-empty-create-btn">✨ 创建第一个项目</button>' +
        '</div>';
      var emptyBtn = document.getElementById('yj-empty-create-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', openNewProjectModal);
      return;
    }

    projectList = Array.isArray(data) ? data : (data.projects || []);
    renderProjectList(projectList);
  }

  function renderProjectList(projects) {
    var listEl = document.getElementById('yj-project-list');
    if (!listEl) return;

    listEl.innerHTML = projects.map(function(p) {
      var si = getStatusInfo(p.status);
      var stageCount = getStageCount(p.status, p.current_stage);
      var progressPct = Math.round((stageCount / 17) * 100);
      var stageStep = stageToStep(p.current_stage);
      var stageName = (stageStep > 0 && stageStep <= 17)
        ? STAGE_NAMES[stageStep - 1]
        : (p.current_stage || '未开始');
      var updatedAt = formatDate(p.updated_at || p.created_at);

      return '<div class="yj-project-card" data-project-id="' + p.project_id + '">' +
        '<div class="yj-project-card-top">' +
          '<h3 class="yj-project-card-name">' + escapeHtml(p.title || '未命名项目') + '</h3>' +
          '<span class="yj-project-status-tag" style="color:' + si.color + ';background:' + si.bg + '">' + si.label + '</span>' +
        '</div>' +
        '<div class="yj-project-card-meta">' +
          '<span>📍 当前阶段：' + escapeHtml(stageName) + '</span>' +
          '<span>📊 完成度：' + stageCount + '/17</span>' +
          '<span>🕐 ' + updatedAt + '</span>' +
        '</div>' +
        '<div class="yj-project-progress-bar">' +
          '<div class="yj-project-progress-fill" style="width:' + progressPct + '%"></div>' +
        '</div>' +
        '<div class="yj-project-card-actions">' +
          '<button class="yj-project-action-btn yj-btn-primary" data-action="continue" data-id="' + p.project_id + '">▶ 继续创作</button>' +
          '<button class="yj-project-action-btn" data-action="view" data-id="' + p.project_id + '">🏆 查看成果</button>' +
          '<button class="yj-project-action-btn yj-btn-danger" data-action="delete" data-id="' + p.project_id + '">🗑 删除</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // 事件委托
    listEl.onclick = function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var id = btn.dataset.id;
      if (action === 'continue') yjContinueProject(id);
      else if (action === 'view') yjViewAchievements(id);
      else if (action === 'delete') yjDeleteProject(id);
    };
  }

  // ========== 新建项目 ==========
  function openNewProjectModal() {
    var modal = document.getElementById('yj-new-project-modal');
    if (modal) {
      modal.classList.add('yj-modal-show');
      document.getElementById('yj-new-project-name').value = '';
      document.getElementById('yj-new-project-idea').value = '';
      setTimeout(function() { document.getElementById('yj-new-project-name').focus(); }, 100);
    }
  }

  function closeNewProjectModal() {
    var modal = document.getElementById('yj-new-project-modal');
    if (modal) modal.classList.remove('yj-modal-show');
  }

  async function createNewProject() {
    var name = document.getElementById('yj-new-project-name').value.trim();
    var idea = document.getElementById('yj-new-project-idea').value.trim();

    if (!idea) {
      showToast('请输入你的短剧创意');
      return;
    }

    var projectName = name || idea.slice(0, 30) + (idea.length > 30 ? '...' : '');
    var btn = document.getElementById('yj-modal-create');
    btn.textContent = '创建中...';
    btn.disabled = true;

    try {
      // Step 1: 创建项目
      var projectData = await apiPost('/api/v1/projects', {
        title: projectName,
        user_id: userId,
        original_idea: idea,
        status: 'draft'
      });

      if (!projectData || !projectData.project_id) {
        showToast('创建项目失败，请稍后重试');
        return;
      }

      var projectId = projectData.project_id;
      showToast('项目创建成功！');
      closeNewProjectModal();

      // Step 2: 切换到工作台（不在此创建workflow，由startCreation统一创建）
      var ideaInput = document.getElementById('ideaInput');
      if (ideaInput) ideaInput.value = idea;
      switchView('workspace');

      // 存储当前项目关联（workflow_id稍后由startCreation填入）
      currentProject = { project_id: projectId, title: projectName, workflow_id: null, original_idea: idea };
      try { localStorage.setItem('yj_current_project', JSON.stringify(currentProject)); } catch(e) {}

      // 触发创作流程，传入项目上下文
      if (typeof window.startCreation === 'function') {
        window.startCreation({ project_id: projectId, idea: idea });
      } else {
        var generateBtn = document.getElementById('generateBtn');
        if (generateBtn) generateBtn.click();
      }

    } catch(e) {
      console.error('[YJ] 创建项目失败', e);
      showToast('创建失败：' + (e.message || '未知错误'));
    } finally {
      btn.textContent = '开始创作';
      btn.disabled = false;
    }
  }

  // ========== 继续创作 ==========
  window.yjContinueProject = async function(projectId) {
    showToast('正在恢复项目...');

    var data = await apiGet('/api/v1/projects/' + projectId);
    if (!data) {
      showToast('获取项目数据失败');
      return;
    }

    var project = data.project || data;
    currentProject = project;

    // 恢复idea到输入框
    var ideaInput = document.getElementById('ideaInput');
    if (ideaInput && project.original_idea) {
      ideaInput.value = project.original_idea;
    }

    // 恢复artifacts到generatedResults
    if (project.artifacts && typeof window.generatedResults !== 'undefined') {
      window.generatedResults = project.artifacts;
    }

    // 恢复current_stage（支持字符串和数字）
    var restoredStep = stageToStep(project.current_stage);
    if (restoredStep > 0) {
      if (typeof window.currentStep !== 'undefined') window.currentStep = restoredStep;
      if (typeof window.stepsCompleted !== 'undefined') window.stepsCompleted = restoredStep;
    }
    // 恢复workflow_id（三方统一）
    if (project.workflow_id) {
      if (typeof currentProject !== 'undefined') currentProject.workflow_id = project.workflow_id;
      if (typeof window.YJBackendBridge !== 'undefined' && window.YJBackendBridge) {
        window.YJBackendBridge.workflowId = project.workflow_id;
      }
      try { localStorage.setItem('yj_current_project', JSON.stringify(currentProject)); } catch(e) {}
    }

    // 如果有workflow且等待用户确认
    if (project.workflow_id && project.status === 'waiting_user') {
      showToast('项目有待确认的检查点，正在恢复...');
    }

    // 恢复创作流程状态
    if (project.current_stage && typeof window.currentStep !== 'undefined') {
      var step = stageToStep(project.current_stage);
      if (step > 0 && step <= 17) {
        window.currentStep = step;
        window.stepsCompleted = step;
      }
    }

    // 显示demo工作区，隐藏欢迎界面
    var appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.display = '';
    }
    var welcomeEl = document.getElementById('welcomeScreen');
    if (welcomeEl) welcomeEl.style.display = 'none';

    // 显示输出容器（如果存在）
    var outputEl = document.getElementById('outputContainer');
    if (outputEl && outputEl.innerHTML === '') {
      outputEl.innerHTML = '<div style="padding:40px;text-align:center;color:#6b7280;">项目 "' + (project.title || '') + '" 已恢复。当前阶段：' + (project.current_stage || '初始') + '。点击"开始生成"继续创作。</div>';
    }

    // 恢复生成按钮状态
    var genBtn = document.getElementById('generateBtn');
    if (genBtn) {
      genBtn.innerHTML = '<span>继续生成</span><span>▶</span>';
      genBtn.disabled = false;
      genBtn.onclick = function() {
        if (typeof window.startCreation === 'function') window.startCreation();
      };
    }

    // 隐藏项目中心页面和导航栏
    document.querySelectorAll('.yj-project-page').forEach(function(p) { p.classList.remove('yj-page-active'); });
    var navbar = document.getElementById('yj-navbar');
    if (navbar) navbar.style.display = 'none';

    // 滚动到工作区
    window.scrollTo(0, 0);

    showToast('项目已恢复：' + (project.title || ''));
    console.log('[YJ] 继续创作 - 项目:', project.title, '阶段:', project.current_stage, '状态:', project.status, 'workflow:', project.workflow_id);
  };

  // ========== 查看成果 ==========
  window.yjViewAchievements = async function(projectId) {
    showToast('加载成果数据...');

    var data = await apiGet('/api/v1/projects/' + projectId);
    if (!data) {
      showToast('获取项目数据失败');
      return;
    }

    var project = data.project || data;
    currentProject = project;

    var achTitle = document.getElementById('yj-ach-title');
    if (achTitle) achTitle.textContent = '🏆 ' + (project.title || '成果中心');

    // 构建tabs
    var artifacts = project.artifacts || {};
    var tabs = [
      { key: 'characters', label: '人物档案' },
      { key: 'outline', label: '故事大纲' },
      { key: 'scripts', label: '分集剧本' },
      { key: 'quality', label: '质量审核' },
      { key: 'all', label: '完整数据' }
    ];

    var tabsEl = document.getElementById('yj-ach-tabs');
    if (tabsEl) {
      tabsEl.innerHTML = tabs.map(function(t, i) {
        return '<button class="yj-ach-tab' + (i === 0 ? ' yj-ach-tab-active' : '') + '" data-tab="' + t.key + '">' + t.label + '</button>';
      }).join('');
    }

    function showTabContent(key) {
      var contentEl = document.getElementById('yj-ach-content');
      if (!contentEl) return;

      var content = '';
      if (key === 'all') {
        content = JSON.stringify(artifacts, null, 2);
      } else {
        content = artifacts[key] || artifacts[key + '_content'] || '';
        if (typeof content === 'object') content = JSON.stringify(content, null, 2);
      }

      contentEl.textContent = content || '暂无该部分内容';
    }

    // 找到第一个有数据的tab
    var firstWithData = tabs.find(function(t) {
      return t.key === 'all' || artifacts[t.key] || artifacts[t.key + '_content'];
    });
    if (firstWithData) showTabContent(firstWithData.key);

    // tab点击事件
    if (tabsEl) {
      tabsEl.onclick = function(e) {
        var tab = e.target.closest('.yj-ach-tab');
        if (!tab) return;
        tabsEl.querySelectorAll('.yj-ach-tab').forEach(function(t) { t.classList.remove('yj-ach-tab-active'); });
        tab.classList.add('yj-ach-tab-active');
        showTabContent(tab.dataset.tab);
      };
    }

    switchView('achievements');
  };

  // ========== 删除项目 ==========
  window.yjDeleteProject = async function(projectId) {
    if (!confirm('确定删除该项目？此操作不可恢复。')) return;

    showToast('删除中...');
    var res = await apiDelete('/api/v1/projects/' + projectId);

    if (res) {
      showToast('项目已删除');
      loadProjectList();
    } else {
      showToast('删除失败');
    }
  };

  // ========== 事件绑定 ==========
  function bindEvents() {
    // 导航栏点击
    document.querySelectorAll('.yj-project-navbar-nav a').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var view = this.dataset.view;
        if (view) switchView(view);
      });
    });

    // 导航栏新建按钮
    var navNewBtn = document.getElementById('yj-nav-new-btn');
    if (navNewBtn) navNewBtn.addEventListener('click', openNewProjectModal);

    // 项目列表新建按钮
    var listNewBtn = document.getElementById('yj-list-new-btn');
    if (listNewBtn) listNewBtn.addEventListener('click', openNewProjectModal);

    // 首页按钮
    var homeStart = document.getElementById('yj-home-start');
    if (homeStart) homeStart.addEventListener('click', openNewProjectModal);

    var homeProjects = document.getElementById('yj-home-projects');
    if (homeProjects) homeProjects.addEventListener('click', function() { switchView('projects'); });

    var homeDemo = document.getElementById('yj-home-demo');
    if (homeDemo) homeDemo.addEventListener('click', function() { switchView('quickdemo'); });

    // 弹窗按钮
    var modalCancel = document.getElementById('yj-modal-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeNewProjectModal);

    var modalCreate = document.getElementById('yj-modal-create');
    if (modalCreate) modalCreate.addEventListener('click', createNewProject);

    // 弹窗overlay点击关闭
    var modalOverlay = document.getElementById('yj-new-project-modal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) closeNewProjectModal();
      });
    }

    // ESC关闭弹窗
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeNewProjectModal();
    });

    // 成果中心返回
    var achBack = document.getElementById('yj-ach-back');
    if (achBack) achBack.addEventListener('click', function() { switchView('projects'); });

    // 复制内容
    var achCopy = document.getElementById('yj-ach-copy');
    if (achCopy) {
      achCopy.addEventListener('click', function() {
        var content = document.getElementById('yj-ach-content');
        if (content && content.textContent) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content.textContent).then(function() {
              showToast('已复制到剪贴板');
            }).catch(function() {
              fallbackCopy(content.textContent);
            });
          } else {
            fallbackCopy(content.textContent);
          }
        }
      });
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('已复制到剪贴板'); }
      catch(e) { showToast('复制失败'); }
      document.body.removeChild(ta);
    }

    // 导出完整项目
    var achExport = document.getElementById('yj-ach-export');
    if (achExport) {
      achExport.addEventListener('click', async function() {
        if (!currentProject || !currentProject.workflow_id) {
          showToast('未选择项目');
          return;
        }
        showToast('正在导出...');
        try {
          var res = await fetch('/api/v1/export/' + currentProject.workflow_id);
          if (res.ok) {
            var blob = await res.blob();
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (currentProject.title || 'project') + '_export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('导出成功！');
          } else {
            // 降级：导出当前可见内容
            var contentEl = document.getElementById('yj-ach-content');
            if (contentEl) {
              var blob2 = new Blob([contentEl.textContent], { type: 'application/json' });
              var url2 = URL.createObjectURL(blob2);
              var a2 = document.createElement('a');
              a2.href = url2;
              a2.download = (currentProject.title || 'project') + '_export.json';
              document.body.appendChild(a2);
              a2.click();
              document.body.removeChild(a2);
              URL.revokeObjectURL(url2);
              showToast('已导出当前内容');
            }
          }
        } catch(e) {
          showToast('导出失败：' + e.message);
        }
      });
    }
  }

  // ========== 拦截原始startCreation ==========
  function hookStartCreation() {
    var attempts = 0;
    var tryHook = setInterval(function() {
      attempts++;
      if (typeof window.startCreation === 'function' && !window._yjHooked) {
        window._yjHooked = true;
        var origStartCreation = window.startCreation;
        window.startCreation = async function(opts) {
          // 如果携带项目上下文，由这里统一创建workflow
          if (opts && opts.project_id) {
            try {
              showToast('创作引擎启动中...');
              var workflowData = await apiPost('/api/v1/create', {
                project_id: opts.project_id,
                story_direction: opts.idea || ''
              });
              if (workflowData && workflowData.workflow_id) {
                var wfId = workflowData.workflow_id;
                // 三方统一 workflow_id
                if (currentProject) {
                  currentProject.workflow_id = wfId;
                }
                try { localStorage.setItem('yj_current_project', JSON.stringify(currentProject)); } catch(e) {}
                // 同步到bridge
                if (window.YJBackendBridge) {
                  window.YJBackendBridge.workflowId = wfId;
                }
                console.log('[YJ] Workflow统一绑定:', wfId, 'project:', opts.project_id);
                showToast('创作引擎已启动！');
              }
            } catch(e) {
              console.error('[YJ] 创建workflow失败', e);
              showToast('引擎启动失败：' + (e.message || ''));
            }
          }
          // 执行原始创作流程（前端17步可视化）
          return origStartCreation.apply(this, arguments);
        };
        clearInterval(tryHook);
      }
      if (attempts > 20) clearInterval(tryHook);
    }, 500);
  }

  // ========== 初始化 ==========
  function init() {
    injectStyles();
    injectDOM();
    bindEvents();
    hookStartCreation();

    // 初始隐藏原始app-container、top-bar和bottom-interaction-wrapper
    var appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.setProperty('display', 'none', 'important');
    var topBar = document.querySelector('.top-bar');
    if (topBar) topBar.style.setProperty('display', 'none', 'important');
    var bottomWrapper = document.querySelector('.bottom-interaction-wrapper');
    if (bottomWrapper) bottomWrapper.style.setProperty('display', 'none', 'important');
    
    // 访客模式：直接隐藏登录界面（welcomeScreen），跳过命名步骤
    var welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    console.log('[云匠引擎] 项目中心模块已加载 ✨');
  }

  // 等待DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
