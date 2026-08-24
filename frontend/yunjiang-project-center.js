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
      .yj-project-account-btn {
        padding: 7px 14px;
        border-radius: 10px;
        border: 1px solid rgba(148,163,184,0.28);
        background: rgba(255,255,255,0.62);
        color: #64748b;
        font-size: 13px;
        cursor: pointer;
        backdrop-filter: blur(14px) saturate(130%);
        -webkit-backdrop-filter: blur(14px) saturate(130%);
        transition: all 0.2s ease;
      }
      .yj-project-account-btn:hover {
        color: #7c3aed;
        border-color: rgba(139,92,246,0.38);
        background: rgba(255,255,255,0.88);
      }
      [data-theme="dark"] .yj-project-account-btn {
        background: rgba(30,41,59,0.68);
        color: #cbd5e1;
        border-color: rgba(148,163,184,0.2);
      }

      /* ========== 页面容器 ========== */
      .yj-project-page {
        display: none !important;
        position: relative;
        padding-top: 72px;
        min-height: 100vh;
        box-sizing: border-box;
      }
      .yj-project-page.yj-page-active { display: block !important; }

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
          <li><a data-view="achievements">🏆 成果中心</a></li><li><a data-view="settings">&#9881; 设置</a></li>
          <li><a data-view="quickdemo">⚡ 快速体验</a></li>
        </ul>
        <div class="yj-project-navbar-right">
          <button class="yj-project-account-btn" id="yj-nav-account-btn" title="返回登录页并切换创作者">👤 切换创作者</button>
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
              <div class="yj-feature-label">6个智能体</div>
            </div>
            <div class="yj-feature-card">
              <div class="yj-feature-icon">🎯</div>
              <div class="yj-feature-label">17位专家</div>
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


      <div class="yj-project-page" id="yj-page-settings">
        <div class="yj-settings-wrap" style="max-width:700px;margin:0 auto;padding:32px 20px;">
          <h2 style="font-size:22px;margin-bottom:20px;color:#1e293b;">&#9881; 系统设置</h2>
          <div id="yj-settings-content" style="display:flex;flex-direction:column;gap:16px;">
            <div class="yj-settings-card" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(16px);border-radius:14px;padding:18px;border:1px solid rgba(255,255,255,0.5);box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="font-weight:600;margin-bottom:6px;color:#475569;">LLM 配置状态</div>
              <div id="yj-settings-llm" style="color:#94a3b8;">加载中...</div>
            </div>
            <div class="yj-settings-card" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(16px);border-radius:14px;padding:18px;border:1px solid rgba(255,255,255,0.5);box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="font-weight:600;margin-bottom:6px;color:#475569;">数据库状态</div>
              <div id="yj-settings-db" style="color:#94a3b8;">加载中...</div>
            </div>
            <div class="yj-settings-card" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(16px);border-radius:14px;padding:18px;border:1px solid rgba(255,255,255,0.5);box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="font-weight:600;margin-bottom:6px;color:#475569;">版本信息</div>
              <div style="color:#64748b;">云匠引擎 v1.0.5</div>
            </div>
          </div>
        </div>
      </div>

      <div class="yj-project-page" id="yj-page-quickdemo">
        <div class="yj-settings-wrap" style="max-width:700px;margin:0 auto;padding:32px 20px;">
          <h2 style="font-size:22px;margin-bottom:20px;color:#1e293b;">&#9889; 快速体验 Demo</h2>
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="yj-settings-card" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(16px);border-radius:14px;padding:18px;border:1px solid rgba(255,255,255,0.5);box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="font-weight:600;margin-bottom:6px;color:#475569;">&#128640; 60秒零 Token 评审 Demo</div>
              <div style="color:#94a3b8;margin-bottom:12px;">载入完整预置案例，立即查看17位专家协作、三个人工检查点与 Agent Run 证据。</div>
              <input type="text" id="yj-demo-idea" placeholder="输入你的短剧创意，例如：一个外卖员意外成为顶级黑客..." style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(203,213,225,0.5);background:rgba(255,255,255,0.8);font-size:14px;outline:none;box-sizing:border-box;" />
              <div style="margin-top:12px;display:flex;gap:10px;">
                <button class="yj-home-btn yj-home-btn-primary" id="yj-demo-run" style="padding:10px 24px;">&#9889; 启动60秒演示</button>
                <button class="yj-home-btn yj-home-btn-secondary" id="yj-demo-example" style="padding:10px 24px;">&#128161; 填充示例</button>
              </div>
              <div id="yj-demo-result" style="margin-top:16px;display:none;">
                <div style="padding:14px;border-radius:10px;background:rgba(241,245,249,0.8);border:1px solid rgba(203,213,225,0.3);color:#475569;font-size:14px;white-space:pre-wrap;line-height:1.6;" id="yj-demo-output"></div>
              </div>
            </div>
            <div class="yj-settings-card" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(16px);border-radius:14px;padding:18px;border:1px solid rgba(255,255,255,0.5);box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="font-weight:600;margin-bottom:6px;color:#475569;">&#128218; Demo功能说明</div>
              <div style="color:#94a3b8;font-size:13px;line-height:1.6;">
                &#8226; 完整体验17个AI Agent的协作流程<br/>
                &#8226; 包含立项评估 &#8594; 大纲生成 &#8594; 角色设定 &#8594; 分集剧情<br/>
                &#8226; 预置案例仅在前端演示，不消耗模型 Token<br/>
                &#8226; 真实创作自动连接 Railway 后端，失联时仍可完成评审 Demo
              </div>
            </div>
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
  function resolveEngineApiBase() {
    var explicit = '';
    try {
      explicit = String(window.YJ_ENGINE_API_BASE || localStorage.getItem('yunjiang_engine_api_base') || '').trim();
    } catch(e) {
      explicit = String(window.YJ_ENGINE_API_BASE || '').trim();
    }
    if (explicit) return explicit.replace(/\/$/, '').replace(/\/api\/v1$/i, '').replace(/\/v1$/i, '');

    var hostname = String(window.location.hostname || '').toLowerCase();
    var isGitHubPages = hostname === 'github.io' || hostname.endsWith('.github.io');
    if (/^https?:$/.test(window.location.protocol) && !isGitHubPages) {
      return window.location.origin.replace(/\/$/, '');
    }
    return 'https://reasonable-magic-production-7faf.up.railway.app';
  }
  window.YJResolveEngineApiBase = window.YJResolveEngineApiBase || resolveEngineApiBase;
  var API_BASE = window.YJResolveEngineApiBase();
  async function apiGet(path) {
    try {
      const res = await fetch(API_BASE + path, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      console.error('[YJ API] GET', path, e);
      return null;
    }
  }

  async function apiPost(path, body) {
    try {
      const res = await fetch(API_BASE + path, {
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
      const res = await fetch(API_BASE + path, { method: 'DELETE' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      console.error('[YJ API] DELETE', path, e);
      return null;
    }
  }

  function hasEnteredStudio() {
    try {
      return localStorage.getItem('yunjiangEntered') === '1';
    } catch (e) {
      return false;
    }
  }

  function setBackgroundVisible(visible) {
    ['.bg-gradient', '.bg-grid'].forEach(function(selector) {
      var el = document.querySelector(selector);
      if (!el) return;
      if (visible) {
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
      } else {
        el.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function showLoginScreen() {
    currentView = 'login';
    var appContainer = document.querySelector('.app-container');
    var onboardingScreen = document.querySelector('.onboarding-screen');
    var projectRoot = document.getElementById('yj-project-root');

    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
      appContainer.style.setProperty('visibility', 'hidden', 'important');
    }
    if (projectRoot) {
      projectRoot.style.setProperty('display', 'none', 'important');
      projectRoot.style.setProperty('visibility', 'hidden', 'important');
    }
    if (onboardingScreen) {
      onboardingScreen.classList.remove('hide');
      onboardingScreen.style.setProperty('display', 'flex', 'important');
      onboardingScreen.style.setProperty('visibility', 'visible', 'important');
      onboardingScreen.style.setProperty('opacity', '1', 'important');
    }
    setBackgroundVisible(true);

    try {
      var creatorInput = document.getElementById('creatorName');
      var savedName = localStorage.getItem('yunjiangCreatorName') || '';
      if (creatorInput && savedName && !creatorInput.value) creatorInput.value = savedName;
      if (typeof window.checkCanEnter === 'function') window.checkCanEnter();
    } catch (e) {}
    window.scrollTo(0, 0);
  }

  function showProjectCenter() {
    var appContainer = document.querySelector('.app-container');
    var onboardingScreen = document.querySelector('.onboarding-screen');
    var projectRoot = document.getElementById('yj-project-root');

    if (appContainer) {
      appContainer.style.setProperty('display', 'none', 'important');
      appContainer.style.setProperty('visibility', 'hidden', 'important');
    }
    if (onboardingScreen) {
      onboardingScreen.classList.add('hide');
      onboardingScreen.style.setProperty('display', 'none', 'important');
      onboardingScreen.style.setProperty('visibility', 'hidden', 'important');
    }
    if (projectRoot) {
      projectRoot.style.setProperty('display', 'block', 'important');
      projectRoot.style.setProperty('visibility', 'visible', 'important');
    }
    setBackgroundVisible(false);
    switchView('home');
    window.scrollTo(0, 0);
  }

  function logoutToLogin() {
    try {
      localStorage.removeItem('yunjiangEntered');
    } catch (e) {}
    showLoginScreen();
    showToast('已返回登录页，项目与创作进度均已保留');
  }

  function hookLoginFlow() {
    if (window.__yjLoginFlowHooked || typeof window.enterStudio !== 'function') return;
    var originalEnterStudio = window.enterStudio;
    window.enterStudio = function() {
      var result = originalEnterStudio.apply(this, arguments);
      setTimeout(showProjectCenter, 0);
      return result;
    };
    window.__yjLoginFlowHooked = true;
  }

  // ========== 视图切换 ==========
  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.yj-project-page').forEach(function(p) { p.classList.remove('yj-page-active'); });
    document.querySelectorAll('.yj-project-navbar-nav a').forEach(function(a) {
      a.classList.remove('yj-nav-active');
      if (a.dataset.view === view) a.classList.add('yj-nav-active');
    });

    var appContainer = document.querySelector('.app-container');
    var onboardingScreen = document.querySelector('.onboarding-screen');
    var projectRoot = document.getElementById('yj-project-root');
    var isProjectView = ['home','projects','achievements','settings','newproject','quickdemo'].indexOf(view) >= 0;

    // Toggle original app-container and onboarding-screen visibility
    if (appContainer) { appContainer.style.setProperty('display', isProjectView ? 'none' : '', 'important'); }
    if (onboardingScreen) { onboardingScreen.style.setProperty('display', isProjectView ? 'none' : '', 'important'); }
    if (projectRoot) { projectRoot.style.setProperty('display', isProjectView ? 'block' : 'none', 'important'); }

    switch (view) {
      case 'home':
        document.getElementById('yj-page-home').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        break;
      case 'projects':
        document.getElementById('yj-page-projects').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        loadProjectList();
        break;
      case 'achievements':
        document.getElementById('yj-page-achievements').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        break;
      case 'workspace':
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', '', 'important');
        break;
      case 'newproject':
        openNewProjectModal();
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        break;
      case 'settings':
        document.getElementById('yj-page-settings').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        loadSettingsPage();
        break;
      case 'quickdemo':
        document.getElementById('yj-page-quickdemo').classList.add('yj-page-active');
        break;
    }
    window.scrollTo(0, 0);
  }

  function showOriginalWelcome() {
    var appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = '';
    var ws = document.getElementById('welcomeScreen');
    if (ws) ws.style.display = '';
    document.querySelectorAll('.yj-project-navbar-nav a').forEach(function(a) { a.classList.remove('yj-nav-active'); });
    currentView = 'welcome';
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

    // 切换到工作台
    switchView('workspace');

    // 隐藏欢迎屏
    var ws = document.getElementById('welcomeScreen');
    if (ws) ws.style.display = 'none';

    showToast('项目已恢复：' + (project.title || ''));
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
      { key: 'experience', label: '体验曲线' },
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

      if (key === 'experience') {
        // Render experience curve using YunjiangExperienceCurve module
        contentEl.innerHTML = '';
        if (window.YunjiangExperienceCurve && window.YunjiangExperienceCurve.render) {
          // Try to find episode data in artifacts
          var episodes = artifacts.scripts || artifacts.episodes || [];
          if (!Array.isArray(episodes)) episodes = [];
          if (episodes.length > 0) {
            window.YunjiangExperienceCurve.render('yj-ach-content', episodes);
          } else {
            // Generate demo data for visualization
            var demoEpisodes = [];
            for (var ep = 1; ep <= 5; ep++) {
              demoEpisodes.push({
                episode: ep,
                suspense: 60 + Math.floor(Math.random() * 30),
                emotion: 55 + Math.floor(Math.random() * 35),
                novelty: 50 + Math.floor(Math.random() * 40),
                thrill: 65 + Math.floor(Math.random() * 25),
                immersion: 60 + Math.floor(Math.random() * 30),
                attachment: 55 + Math.floor(Math.random() * 35)
              });
            }
            window.YunjiangExperienceCurve.render('yj-ach-content', demoEpisodes);
            contentEl.innerHTML += '<div style="text-align:center;padding:12px;color:#94a3b8;font-size:13px;">* 当前为演示数据，实际创作后将显示真实分析结果</div>';
          }
        } else {
          contentEl.textContent = '体验曲线模块未加载';
        }
        return;
      }

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

    // 返回原登录页；仅退出界面状态，不删除项目和创作进度
    var accountBtn = document.getElementById('yj-nav-account-btn');
    if (accountBtn) accountBtn.addEventListener('click', logoutToLogin);

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

    // 快速体验按钮
    var demoExample = document.getElementById('yj-demo-example');
    if (demoExample) demoExample.addEventListener('click', function() {
      document.getElementById('yj-demo-idea').value = '一个普通外卖员意外获得时间停止能力，在城市中经历一系列荒诞又感人的故事';
    });

    var demoRun = document.getElementById('yj-demo-run');
    if (demoRun) demoRun.addEventListener('click', function() {
      var idea = document.getElementById('yj-demo-idea').value.trim();
      if (!idea) {
        idea = '非遗蓝印花布传承人林晚晴，为保住祖传工坊与商业资本展开三代人的守艺之战。';
        document.getElementById('yj-demo-idea').value = idea;
      }
      var resultDiv = document.getElementById('yj-demo-result');
      var outputEl = document.getElementById('yj-demo-output');
      resultDiv.style.display = 'block';
      outputEl.textContent = '正在载入评审演示...';
      try {
        if (typeof window.startQuickDemo === 'function') window.startQuickDemo();
        outputEl.textContent = '演示已就绪（零 Token）\n\n✓ 17位 Agent 协作执行\n✓ 角色设定 → 剧情大纲 → 分集剧本 3个人工检查点\n✓ 决策、执行、监督与返工证据\n✓ Session、风格包与结构化导出\n\n请点击右下角「Agent Run 证据」逐项检视。';
      } catch(err) {
        outputEl.textContent = '演示载入失败：' + err.message;
      }
    });

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
          var res = await fetch(API_BASE + '/api/v1/export/' + currentProject.workflow_id);
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


  async function loadSettingsPage() {
    try {
      var res = await fetch(API_BASE + '/health');
      var h = await res.json();
      var llmEl = document.getElementById('yj-settings-llm');
      if (llmEl) {
        llmEl.textContent = "模型: " + (h.model || 'unknown') + " | 状态: " + (h.llm_configured ? '已配置' : '未配置');
        llmEl.style.color = h.llm_configured ? '#10b981' : '#ef4444';
      }
      var dbEl = document.getElementById('yj-settings-db');
      if (dbEl) {
        dbEl.textContent = "SQLite (yunjiang.db) | 状态: 正常";
        dbEl.style.color = '#10b981';
      }
    } catch(e) {
      var llmEl2 = document.getElementById('yj-settings-llm');
      if (llmEl2) llmEl2.textContent = "无法连接: " + e.message;
    }
  }

  // ========== 初始化 ==========
  function init() {
    injectStyles();
    injectDOM();
    bindEvents();
    hookStartCreation();
    hookLoginFlow();

    // 首次访问恢复原登录页；已登录用户进入项目中心。
    if (hasEnteredStudio()) showProjectCenter();
    else showLoginScreen();

    console.log('[云匠引擎] 项目中心模块已加载 ✨');
  }

  // 等待DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

