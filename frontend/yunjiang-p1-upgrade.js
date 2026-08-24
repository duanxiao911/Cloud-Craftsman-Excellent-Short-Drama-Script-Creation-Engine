/**
 * 云匠智能精品短剧引擎 - P1 功能升级模块
 * 清单 #10 专业模式切换 | #11 HITL UI增强 | #12 正式状态系统
 * 清单 #13 错误恢复UI  | #14 导出增强    | #16 工作台布局优化
 * @version 1.0.0
 */
(function() {
  'use strict';

  /* ============================================================
   *  §0  全局常量 & 配置
   * ============================================================ */
  var MODE_KEY   = 'yj_display_mode';        // localStorage key
  var MODE_PRO   = 'pro';                    // 专业模式值
  var MODE_NORM  = 'normal';                 // 普通模式值

  // §12 七种正式状态
  var STATUS_7 = {
    draft:        { label: '草稿',       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '📝' },
    creating:     { label: '创作中',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '✍️', anim: true },
    waiting_user: { label: '等待确认',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '⏳', blink: true },
    running:      { label: '执行中',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: '🚀' },
    paused:       { label: '暂停',       color: '#eab308', bg: 'rgba(234,179,8,0.12)',   icon: '⏸' },
    failed:       { label: '失败',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '❌' },
    completed:    { label: '已完成',     color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '✅' }
  };

  // §16 工作台流程步骤
  var WORKFLOW_STEPS = [
    { key: 'idea',       label: '需求',   icon: '💡' },
    { key: 'characters', label: '人物',   icon: '🎭' },
    { key: 'outline',    label: '大纲',   icon: '📋' },
    { key: 'script',     label: '剧本',   icon: '🎬' },
    { key: 'review',     label: '审核',   icon: '🔍' }
  ];

  // §10 普通模式友好文案映射
  var FRIENDLY_MSGS = {
    idea:       '云匠正在理解您的创作需求……',
    characters: '云匠正在进行人物塑造……',
    outline:    '云匠正在构思故事脉络……',
    script:     '云匠正在打磨剧本细节……',
    review:     '云匠正在进行质量审核……',
    _default:   '云匠正在全力创作中……'
  };

  var currentMode = MODE_NORM;
  try { currentMode = localStorage.getItem(MODE_KEY) || MODE_NORM; } catch(e){}

  /* ============================================================
   *  §0.1  样式注入
   * ============================================================ */
  function injectP1Styles() {
    if (document.getElementById('yj-p1-styles')) return;
    var s = document.createElement('style');
    s.id = 'yj-p1-styles';
    s.textContent = `
      /* ========== §10 模式切换按钮 ========== */
      .yj-mode-toggle {
        display: flex; align-items: center; gap: 0;
        background: rgba(255,255,255,0.52);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(148,163,184,0.15);
        border-radius: 12px;
        overflow: hidden;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      [data-theme="dark"] .yj-mode-toggle {
        background: rgba(30,28,52,0.55);
        border-color: rgba(139,92,246,0.12);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .yj-mode-btn {
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        border: none;
        background: transparent;
        transition: all 0.25s ease;
        white-space: nowrap;
        position: relative;
      }
      [data-theme="dark"] .yj-mode-btn { color: #94a3b8; }
      .yj-mode-btn.active {
        color: #fff;
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(139,92,246,0.3);
      }
      .yj-mode-btn:hover:not(.active) {
        color: #8b5cf6;
        background: rgba(139,92,246,0.06);
      }

      /* ========== §10 专业模式 Agent 执行信息条 ========== */
      .yj-pro-agent-bar {
        display: none;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        margin: 8px 0;
        background: rgba(255,255,255,0.52);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 14px;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        font-size: 13px;
        color: #334155;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        transition: all 0.3s ease;
        animation: yjProBarFadeIn 0.35s ease;
      }
      @keyframes yjProBarFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      [data-theme="dark"] .yj-pro-agent-bar {
        background: rgba(30,28,52,0.55);
        border-color: rgba(139,92,246,0.12);
        color: #cbd5e1;
      }
      .yj-pro-agent-bar.visible { display: flex; }
      .yj-pro-agent-name {
        font-weight: 600;
        color: #8b5cf6;
        display: flex; align-items: center; gap: 5px;
      }
      .yj-pro-agent-name::before { content: '🤖'; font-size: 14px; }
      .yj-pro-skill-name {
        color: #3b82f6;
        font-weight: 500;
      }
      .yj-pro-skill-version {
        font-size: 11px;
        color: #94a3b8;
        padding: 1px 6px;
        background: rgba(148,163,184,0.1);
        border-radius: 6px;
      }
      .yj-pro-status-check {
        font-size: 12px;
        color: #10b981;
        display: flex; align-items: center; gap: 3px;
      }
      .yj-pro-status-check::before { content: '✓'; font-weight: 700; }
      .yj-pro-arrow { color: #94a3b8; font-size: 11px; }
      .yj-pro-agent-bar .yj-pro-spinner {
        width: 14px; height: 14px;
        border: 2px solid rgba(139,92,246,0.2);
        border-top-color: #8b5cf6;
        border-radius: 50%;
        animation: yjSpin 0.8s linear infinite;
      }
      @keyframes yjSpin { to { transform: rotate(360deg); } }

      /* ========== §10 普通模式友好提示 ========== */
      .yj-friendly-msg {
        display: none;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        margin: 8px 0;
        background: rgba(255,255,255,0.52);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 14px;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        font-size: 14px;
        color: #475569;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        animation: yjFriendlyPulse 2.5s ease-in-out infinite;
      }
      @keyframes yjFriendlyPulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      [data-theme="dark"] .yj-friendly-msg {
        background: rgba(30,28,52,0.55);
        border-color: rgba(139,92,246,0.12);
        color: #94a3b8;
      }
      .yj-friendly-msg.visible { display: flex; }
      .yj-friendly-msg .yj-friendly-icon {
        font-size: 18px;
        animation: yjFriendlyBounce 1.5s ease-in-out infinite;
      }
      @keyframes yjFriendlyBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }

      /* ========== §12 正式状态系统 ========== */
      .yj-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        transition: all 0.3s ease;
        white-space: nowrap;
      }
      .yj-status-badge[data-status="draft"] {
        color: #94a3b8; background: rgba(148,163,184,0.12);
      }
      .yj-status-badge[data-status="creating"] {
        color: #3b82f6; background: rgba(59,130,246,0.12);
        animation: yjStatusPulse 1.8s ease-in-out infinite;
      }
      @keyframes yjStatusPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.2); }
        50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
      }
      .yj-status-badge[data-status="waiting_user"] {
        color: #f59e0b; background: rgba(245,158,11,0.12);
        animation: yjStatusBlink 1.2s ease-in-out infinite;
      }
      @keyframes yjStatusBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .yj-status-badge[data-status="running"] {
        color: #8b5cf6; background: rgba(139,92,246,0.12);
      }
      .yj-status-badge[data-status="paused"] {
        color: #eab308; background: rgba(234,179,8,0.12);
      }
      .yj-status-badge[data-status="failed"] {
        color: #ef4444; background: rgba(239,68,68,0.12);
      }
      .yj-status-badge[data-status="completed"] {
        color: #10b981; background: rgba(16,185,129,0.12);
      }

      /* 项目卡片中的状态条 */
      .yj-card-status-strip {
        height: 3px;
        border-radius: 2px;
        margin-top: 8px;
        transition: all 0.4s ease;
      }
      .yj-card-status-strip.creating {
        background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
        background-size: 200% 100%;
        animation: yjStatusFlow 2s linear infinite;
      }
      @keyframes yjStatusFlow {
        from { background-position: 0% 0; }
        to   { background-position: 200% 0; }
      }

      /* ========== §13 错误恢复面板 ========== */
      .yj-error-recovery {
        display: none;
        flex-direction: column;
        gap: 14px;
        padding: 20px 24px;
        margin: 12px 0;
        background: rgba(255,255,255,0.62);
        backdrop-filter: blur(20px) saturate(1.6);
        -webkit-backdrop-filter: blur(20px) saturate(1.6);
        border: 1px solid rgba(239,68,68,0.15);
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(239,68,68,0.06), inset 0 1px 1px rgba(255,255,255,0.35);
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        animation: yjErrorSlideIn 0.4s ease;
      }
      @keyframes yjErrorSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      [data-theme="dark"] .yj-error-recovery {
        background: rgba(30,28,52,0.62);
        border-color: rgba(239,68,68,0.2);
        box-shadow: 0 4px 20px rgba(239,68,68,0.1), inset 0 1px 1px rgba(255,255,255,0.04);
      }
      .yj-error-recovery.visible { display: flex; }
      .yj-error-recovery-header {
        display: flex; align-items: center; gap: 8px;
        font-size: 15px; font-weight: 600; color: #ef4444;
      }
      .yj-error-recovery-header::before {
        content: '⚠️'; font-size: 18px;
      }
      .yj-error-recovery-detail {
        font-size: 13px; color: #64748b;
        padding: 8px 12px;
        background: rgba(239,68,68,0.05);
        border-radius: 10px;
        border-left: 3px solid rgba(239,68,68,0.3);
      }
      [data-theme="dark"] .yj-error-recovery-detail { color: #94a3b8; }
      .yj-error-recovery-actions {
        display: flex; gap: 10px; flex-wrap: wrap;
      }
      .yj-error-recovery-btn {
        padding: 8px 18px;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
      }
      .yj-error-recovery-btn.yj-retry {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: #fff;
        box-shadow: 0 2px 8px rgba(139,92,246,0.3);
      }
      .yj-error-recovery-btn.yj-retry:hover {
        box-shadow: 0 4px 14px rgba(139,92,246,0.4);
        transform: translateY(-1px);
      }
      .yj-error-recovery-btn.yj-checkpoint {
        background: rgba(59,130,246,0.1);
        color: #3b82f6;
        border: 1px solid rgba(59,130,246,0.2);
      }
      .yj-error-recovery-btn.yj-checkpoint:hover {
        background: rgba(59,130,246,0.18);
        transform: translateY(-1px);
      }

      /* ========== §14 导出增强面板 ========== */
      .yj-export-modal-overlay {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 20000;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        align-items: center;
        justify-content: center;
        animation: yjOverlayFadeIn 0.3s ease;
      }
      @keyframes yjOverlayFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .yj-export-modal-overlay.visible { display: flex; }
      .yj-export-modal {
        width: 480px;
        max-width: 92vw;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(255,255,255,0.72);
        backdrop-filter: blur(20px) saturate(1.6);
        -webkit-backdrop-filter: blur(20px) saturate(1.6);
        border: 1px solid rgba(255,255,255,0.28);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.35);
        padding: 28px;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        animation: yjModalSlideUp 0.35s ease;
      }
      @keyframes yjModalSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      [data-theme="dark"] .yj-export-modal {
        background: rgba(30,28,52,0.72);
        border-color: rgba(255,255,255,0.08);
        box-shadow: 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04);
      }
      .yj-export-modal h3 {
        margin: 0 0 6px;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }
      [data-theme="dark"] .yj-export-modal h3 { color: #f1f5f9; }
      .yj-export-modal-subtitle {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 20px;
      }
      [data-theme="dark"] .yj-export-modal-subtitle { color: #94a3b8; }
      .yj-export-format-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }
      .yj-export-format-card {
        padding: 16px;
        border-radius: 14px;
        border: 2px solid rgba(148,163,184,0.15);
        background: rgba(255,255,255,0.5);
        cursor: pointer;
        transition: all 0.25s ease;
        text-align: center;
      }
      [data-theme="dark"] .yj-export-format-card {
        background: rgba(255,255,255,0.05);
        border-color: rgba(139,92,246,0.12);
      }
      .yj-export-format-card:hover,
      .yj-export-format-card.selected {
        border-color: #8b5cf6;
        background: rgba(139,92,246,0.06);
        box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
      }
      .yj-export-format-card .yj-export-fmt-icon { font-size: 28px; margin-bottom: 6px; }
      .yj-export-format-card .yj-export-fmt-name {
        font-size: 14px; font-weight: 600; color: #1e293b;
      }
      [data-theme="dark"] .yj-export-format-card .yj-export-fmt-name { color: #e2e8f0; }
      .yj-export-format-card .yj-export-fmt-desc {
        font-size: 11px; color: #94a3b8; margin-top: 4px;
      }
      .yj-export-content-list {
        margin-bottom: 20px;
        padding: 12px 16px;
        background: rgba(139,92,246,0.04);
        border-radius: 12px;
      }
      .yj-export-content-list h4 {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 600;
        color: #475569;
      }
      [data-theme="dark"] .yj-export-content-list h4 { color: #94a3b8; }
      .yj-export-content-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;
        padding: 3px 0;
      }
      [data-theme="dark"] .yj-export-content-item { color: #94a3b8; }
      .yj-export-content-item::before { content: '✓'; color: #10b981; font-weight: 700; }
      .yj-export-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .yj-export-modal-btn {
        padding: 9px 22px;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
      }
      .yj-export-modal-btn.yj-export-cancel {
        background: rgba(148,163,184,0.12);
        color: #64748b;
      }
      .yj-export-modal-btn.yj-export-cancel:hover { background: rgba(148,163,184,0.2); }
      .yj-export-modal-btn.yj-export-confirm {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: #fff;
        box-shadow: 0 2px 8px rgba(139,92,246,0.3);
      }
      .yj-export-modal-btn.yj-export-confirm:hover {
        box-shadow: 0 4px 14px rgba(139,92,246,0.4);
        transform: translateY(-1px);
      }

      /* ========== §11 HITL 人机协作面板 ========== */
      .yj-hitl-panel {
        display: none;
        flex-direction: column;
        gap: 14px;
        padding: 20px 24px;
        margin: 12px 0;
        background: rgba(255,255,255,0.62);
        backdrop-filter: blur(20px) saturate(1.6);
        -webkit-backdrop-filter: blur(20px) saturate(1.6);
        border: 1px solid rgba(139,92,246,0.15);
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(139,92,246,0.06), inset 0 1px 1px rgba(255,255,255,0.35);
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        animation: yjHitlSlideIn 0.4s ease;
      }
      @keyframes yjHitlSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      [data-theme="dark"] .yj-hitl-panel {
        background: rgba(30,28,52,0.62);
        border-color: rgba(139,92,246,0.2);
        box-shadow: 0 4px 20px rgba(139,92,246,0.12), inset 0 1px 1px rgba(255,255,255,0.04);
      }
      .yj-hitl-panel.visible { display: flex; }
      .yj-hitl-header {
        display: flex; align-items: center; gap: 8px;
        font-size: 15px; font-weight: 600; color: #8b5cf6;
      }
      .yj-hitl-header::before { content: '🎯'; font-size: 18px; }
      .yj-hitl-stage-name {
        padding: 3px 10px;
        background: rgba(139,92,246,0.08);
        border-radius: 8px;
        font-size: 13px;
        color: #6366f1;
        font-weight: 500;
      }
      .yj-hitl-actions {
        display: flex; gap: 10px; flex-wrap: wrap;
      }
      .yj-hitl-btn {
        padding: 8px 18px;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
      }
      .yj-hitl-btn.yj-hitl-approve {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        box-shadow: 0 2px 8px rgba(16,185,129,0.3);
      }
      .yj-hitl-btn.yj-hitl-approve:hover {
        box-shadow: 0 4px 14px rgba(16,185,129,0.4);
        transform: translateY(-1px);
      }
      .yj-hitl-btn.yj-hitl-feedback {
        background: rgba(59,130,246,0.1);
        color: #3b82f6;
        border: 1px solid rgba(59,130,246,0.2);
      }
      .yj-hitl-btn.yj-hitl-feedback:hover { background: rgba(59,130,246,0.18); }
      .yj-hitl-btn.yj-hitl-edit {
        background: rgba(245,158,11,0.1);
        color: #d97706;
        border: 1px solid rgba(245,158,11,0.2);
      }
      .yj-hitl-btn.yj-hitl-edit:hover { background: rgba(245,158,11,0.18); }
      .yj-hitl-btn.yj-hitl-resubmit {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: #fff;
        box-shadow: 0 2px 8px rgba(139,92,246,0.3);
        display: none;
      }
      .yj-hitl-btn.yj-hitl-resubmit.visible { display: inline-flex; }
      .yj-hitl-btn.yj-hitl-resubmit:hover {
        box-shadow: 0 4px 14px rgba(139,92,246,0.4);
        transform: translateY(-1px);
      }

      /* HITL 反馈输入区 */
      .yj-hitl-feedback-area,
      .yj-hitl-edit-area {
        display: none;
        flex-direction: column;
        gap: 10px;
        margin-top: 4px;
      }
      .yj-hitl-feedback-area.visible,
      .yj-hitl-edit-area.visible { display: flex; }
      .yj-hitl-textarea {
        width: 100%;
        min-height: 80px;
        padding: 12px 14px;
        border: 1px solid rgba(148,163,184,0.2);
        border-radius: 12px;
        font-size: 13px;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
        color: #334155;
        background: rgba(255,255,255,0.7);
        resize: vertical;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
      }
      [data-theme="dark"] .yj-hitl-textarea {
        color: #cbd5e1;
        background: rgba(255,255,255,0.05);
        border-color: rgba(139,92,246,0.15);
      }
      .yj-hitl-textarea:focus {
        outline: none;
        border-color: #8b5cf6;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
      }
      .yj-hitl-edit-area .yj-hitl-textarea { min-height: 160px; }
      .yj-hitl-inline-actions { display: flex; gap: 8px; }

      /* ========== §16 工作台三栏布局 ========== */
      .yj-workspace-layout {
        display: none;
        grid-template-columns: 200px 1fr 240px;
        gap: 16px;
        height: calc(100vh - 72px);
        padding: 0;
        font-family: 'Noto Sans SC', -apple-system, sans-serif;
      }
      .yj-workspace-layout.visible { display: grid; }

      /* 左栏：流程步骤 */
      .yj-ws-left {
        background: rgba(255,255,255,0.52);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 16px;
        padding: 16px 12px;
        overflow-y: auto;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      }
      [data-theme="dark"] .yj-ws-left {
        background: rgba(30,28,52,0.55);
        border-color: rgba(139,92,246,0.12);
      }
      .yj-ws-step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.25s ease;
        margin-bottom: 4px;
        position: relative;
      }
      .yj-ws-step:hover { background: rgba(139,92,246,0.06); }
      .yj-ws-step.active {
        background: rgba(139,92,246,0.1);
        border-left: 3px solid #8b5cf6;
      }
      .yj-ws-step.completed .yj-ws-step-icon {
        background: rgba(16,185,129,0.12);
        color: #10b981;
      }
      .yj-ws-step.active .yj-ws-step-icon {
        background: rgba(139,92,246,0.12);
        color: #8b5cf6;
      }
      .yj-ws-step-icon {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 8px;
        font-size: 16px;
        background: rgba(148,163,184,0.1);
        transition: all 0.25s ease;
      }
      .yj-ws-step-label {
        font-size: 13px;
        font-weight: 500;
        color: #475569;
      }
      [data-theme="dark"] .yj-ws-step-label { color: #cbd5e1; }
      .yj-ws-step-connector {
        position: absolute;
        left: 27px;
        top: 42px;
        width: 2px;
        height: calc(100% - 24px);
        background: rgba(148,163,184,0.15);
      }
      .yj-ws-step.completed .yj-ws-step-connector {
        background: rgba(16,185,129,0.3);
      }

      /* 中栏：创作内容 */
      .yj-ws-center {
        background: rgba(255,255,255,0.52);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 16px;
        padding: 20px;
        overflow-y: auto;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      }
      [data-theme="dark"] .yj-ws-center {
        background: rgba(30,28,52,0.55);
        border-color: rgba(139,92,246,0.12);
      }
      .yj-ws-center-title {
        font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px;
      }
      [data-theme="dark"] .yj-ws-center-title { color: #f1f5f9; }

      /* 右栏：Agent/Skill/质量信息 */
      .yj-ws-right {
        background: rgba(255,255,255,0.52);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 16px;
        padding: 16px 12px;
        overflow-y: auto;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      }
      [data-theme="dark"] .yj-ws-right {
        background: rgba(30,28,52,0.55);
        border-color: rgba(139,92,246,0.12);
      }
      .yj-ws-info-block {
        margin-bottom: 16px;
      }
      .yj-ws-info-title {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .yj-ws-agent-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(139,92,246,0.05);
        margin-bottom: 6px;
        font-size: 12px;
        color: #475569;
        transition: all 0.25s ease;
      }
      [data-theme="dark"] .yj-ws-agent-card { color: #cbd5e1; }
      .yj-ws-agent-card.working {
        background: rgba(139,92,246,0.1);
        border-left: 3px solid #8b5cf6;
      }
      .yj-ws-agent-card.done {
        background: rgba(16,185,129,0.06);
        border-left: 3px solid #10b981;
      }
      .yj-ws-agent-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #94a3b8;
        flex-shrink: 0;
      }
      .yj-ws-agent-card.working .yj-ws-agent-dot {
        background: #8b5cf6;
        animation: yjDotPulse 1.2s ease-in-out infinite;
      }
      @keyframes yjDotPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
        50% { box-shadow: 0 0 0 4px rgba(139,92,246,0); }
      }
      .yj-ws-agent-card.done .yj-ws-agent-dot { background: #10b981; }
      .yj-ws-quality-bar {
        height: 6px;
        border-radius: 3px;
        background: rgba(148,163,184,0.12);
        margin-top: 6px;
        overflow: hidden;
      }
      .yj-ws-quality-fill {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, #8b5cf6, #10b981);
        transition: width 0.6s ease;
      }

      /* 响应式 */
      @media (max-width: 900px) {
        .yj-workspace-layout { grid-template-columns: 1fr; }
        .yj-ws-left, .yj-ws-right { display: none; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ============================================================
   *  §10  专业模式切换
   * ============================================================ */
  function installModeToggle() {
    var navbarRight = document.querySelector('.yj-project-navbar-right');
    if (!navbarRight || document.getElementById('yj-mode-toggle')) return;

    var toggle = document.createElement('div');
    toggle.className = 'yj-mode-toggle';
    toggle.id = 'yj-mode-toggle';
    toggle.innerHTML =
      '<button class="yj-mode-btn' + (currentMode === MODE_NORM ? ' active' : '') + '" data-mode="' + MODE_NORM + '">普通模式</button>' +
      '<button class="yj-mode-btn' + (currentMode === MODE_PRO ? ' active' : '') + '" data-mode="' + MODE_PRO + '">专业模式</button>';

    navbarRight.insertBefore(toggle, navbarRight.firstChild);

    toggle.addEventListener('click', function(e) {
      var btn = e.target.closest('.yj-mode-btn');
      if (!btn) return;
      var mode = btn.getAttribute('data-mode');
      if (mode === currentMode) return;
      currentMode = mode;
      try { localStorage.setItem(MODE_KEY, mode); } catch(e){}
      toggle.querySelectorAll('.yj-mode-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
      });
      updateDisplayMode();
    });
  }

  function updateDisplayMode() {
    document.body.setAttribute('data-yj-mode', currentMode);
    // 隐藏不需要的显示元素
    var proBars = document.querySelectorAll('.yj-pro-agent-bar');
    var friendlyMsgs = document.querySelectorAll('.yj-friendly-msg');
    if (currentMode === MODE_PRO) {
      proBars.forEach(function(el) { if (el.dataset.active === 'true') el.classList.add('visible'); });
      friendlyMsgs.forEach(function(el) { el.classList.remove('visible'); });
    } else {
      proBars.forEach(function(el) { el.classList.remove('visible'); });
      friendlyMsgs.forEach(function(el) { if (el.dataset.active === 'true') el.classList.add('visible'); });
    }
  }

  // 显示 Agent 执行信息（专业模式）
  function showAgentExecution(info) {
    var bar = getOrCreateProBar();
    if (!bar) return;
    bar.innerHTML =
      '<div class="yj-pro-spinner"></div>' +
      '<span class="yj-pro-agent-name">' + esc(info.agent || 'Agent') + '</span>' +
      '<span class="yj-pro-arrow">→</span>' +
      '<span class="yj-pro-skill-name">' + esc(info.skill || 'Skill') + '</span>' +
      '<span class="yj-pro-skill-version">v' + esc(info.version || '1.0') + '</span>' +
      (info.checks || []).map(function(c) {
        return '<span class="yj-pro-status-check">' + esc(c) + '</span>';
      }).join('');
    bar.dataset.active = 'true';
    bar.classList.add('visible');
    // 普通模式隐藏专业条
    if (currentMode === MODE_NORM) {
      bar.classList.remove('visible');
      showFriendlyMsg(info.stepKey || '_default');
    }
  }

  function showFriendlyMsg(stepKey) {
    var msg = getOrCreateFriendlyMsg();
    if (!msg) return;
    msg.innerHTML =
      '<span class="yj-friendly-icon">✨</span>' +
      '<span>' + esc(FRIENDLY_MSGS[stepKey] || FRIENDLY_MSGS._default) + '</span>';
    msg.dataset.active = 'true';
    if (currentMode === MODE_NORM) msg.classList.add('visible');
  }

  function hideExecutionUI() {
    var bar = document.getElementById('yj-pro-agent-bar');
    var msg = document.getElementById('yj-friendly-msg');
    if (bar) { bar.classList.remove('visible'); bar.dataset.active = 'false'; }
    if (msg) { msg.classList.remove('visible'); msg.dataset.active = 'false'; }
  }

  function getOrCreateProBar() {
    var bar = document.getElementById('yj-pro-agent-bar');
    if (bar) return bar;
    // 插入到创作区域顶部
    var anchor = document.querySelector('.modern-input-card') ||
                 document.querySelector('.canvas-card') ||
                 document.querySelector('#yj-project-root');
    if (!anchor) return null;
    bar = document.createElement('div');
    bar.className = 'yj-pro-agent-bar';
    bar.id = 'yj-pro-agent-bar';
    anchor.parentNode.insertBefore(bar, anchor);
    return bar;
  }

  function getOrCreateFriendlyMsg() {
    var msg = document.getElementById('yj-friendly-msg');
    if (msg) return msg;
    var anchor = document.querySelector('.modern-input-card') ||
                 document.querySelector('.canvas-card') ||
                 document.querySelector('#yj-project-root');
    if (!anchor) return null;
    msg = document.createElement('div');
    msg.className = 'yj-friendly-msg';
    msg.id = 'yj-friendly-msg';
    anchor.parentNode.insertBefore(msg, anchor);
    return msg;
  }

  /* ============================================================
   *  §12  正式状态系统
   * ============================================================ */
  function createStatusBadge(status) {
    var info = STATUS_7[status] || STATUS_7.draft;
    var badge = document.createElement('span');
    badge.className = 'yj-status-badge';
    badge.setAttribute('data-status', status);
    badge.textContent = info.icon + ' ' + info.label;
    return badge;
  }

  // 增强项目卡片的状态显示
  function enhanceProjectCards() {
    var cards = document.querySelectorAll('.yj-project-card, [class*="project-card"]');
    cards.forEach(function(card) {
      if (card.dataset.yjStatusEnhanced) return;
      card.dataset.yjStatusEnhanced = 'true';

      // 查找或创建状态条
      var strip = card.querySelector('.yj-card-status-strip');
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'yj-card-status-strip';
        card.appendChild(strip);
      }

      // 查找或创建状态徽章
      var existingBadge = card.querySelector('.yj-status-badge');
      if (!existingBadge) {
        var status = card.dataset.status || 'draft';
        var badge = createStatusBadge(status);
        var header = card.querySelector('.card-status-header, .yj-card-header, h3, h4');
        if (header) header.parentNode.insertBefore(badge, header.nextSibling);
      }
    });
  }

  // 更新状态显示
  function updateStatusDisplay(element, newStatus) {
    var info = STATUS_7[newStatus] || STATUS_7.draft;
    var badge = element.querySelector('.yj-status-badge');
    if (badge) {
      badge.setAttribute('data-status', newStatus);
      badge.textContent = info.icon + ' ' + info.label;
    }
    var strip = element.querySelector('.yj-card-status-strip');
    if (strip) {
      strip.className = 'yj-card-status-strip ' + newStatus;
      strip.style.background = info.color;
    }
  }

  // 全局 API
  window.YJStatus = {
    STATUS_7: STATUS_7,
    createBadge: createStatusBadge,
    update: updateStatusDisplay,
    enhanceCards: enhanceProjectCards
  };

  /* ============================================================
   *  §13  错误恢复 UI
   * ============================================================ */
  function showErrorRecovery(errorInfo) {
    var panel = getOrCreateErrorPanel();
    if (!panel) return;
    var detail = panel.querySelector('.yj-error-recovery-detail');
    if (detail) {
      detail.textContent = errorInfo.message || '执行过程中发生未知错误';
    }
    panel.classList.add('visible');
    panel.dataset.active = 'true';
  }

  function hideErrorRecovery() {
    var panel = document.getElementById('yj-error-recovery');
    if (panel) { panel.classList.remove('visible'); panel.dataset.active = 'false'; }
  }

  function getOrCreateErrorPanel() {
    var panel = document.getElementById('yj-error-recovery');
    if (panel) return panel;
    var anchor = document.querySelector('.modern-input-card') ||
                 document.querySelector('.canvas-card') ||
                 document.querySelector('#yj-project-root');
    if (!anchor) return null;
    panel = document.createElement('div');
    panel.className = 'yj-error-recovery';
    panel.id = 'yj-error-recovery';
    panel.innerHTML =
      '<div class="yj-error-recovery-header">执行失败</div>' +
      '<div class="yj-error-recovery-detail">执行过程中发生未知错误</div>' +
      '<div class="yj-error-recovery-actions">' +
        '<button class="yj-error-recovery-btn yj-retry" onclick="window.YJErrorRecovery.retry()">🔄 重新执行</button>' +
        '<button class="yj-error-recovery-btn yj-checkpoint" onclick="window.YJErrorRecovery.resumeFromCheckpoint()">📍 从最近检查点恢复</button>' +
      '</div>';
    anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    return panel;
  }

  // SSE 错误监听
  function installSSEErrorListener() {
    // 监听全局 SSE 错误事件
    var origAddEventListener = EventTarget.prototype.addEventListener;
    var sseTypes = ['error', 'message'];

    // Hook into EventSource if available
    if (typeof EventSource !== 'undefined') {
      var OrigEventSource = window.EventSource;
      window.EventSource = function(url, opts) {
        var es = new OrigEventSource(url, opts);
        es.addEventListener('error', function(e) {
          // 延迟检测，因为某些错误是瞬时的
          setTimeout(function() {
            if (es.readyState === OrigEventSource.CLOSED) {
              showErrorRecovery({
                message: 'SSE 连接已断开，可能是网络不稳定或服务端异常',
                source: 'EventSource',
                url: url
              });
            }
          }, 500);
        });
        return es;
      };
      window.EventSource.CONNECTING = OrigEventSource.CONNECTING;
      window.EventSource.OPEN = OrigEventSource.OPEN;
      window.EventSource.CLOSED = OrigEventSource.CLOSED;
    }

    // 监听 fetch 错误
    var origFetch = window.fetch;
    window.fetch = function() {
      return origFetch.apply(this, arguments).catch(function(err) {
        // 仅对 API 请求报错
        var url = arguments[0];
        if (typeof url === 'string' && url.includes('/api/')) {
          showErrorRecovery({
            message: 'API 请求失败: ' + (err.message || '网络错误'),
            source: 'fetch',
            url: url
          });
        }
        throw err;
      });
    };
  }

  // 全局错误恢复 API
  window.YJErrorRecovery = {
    show: showErrorRecovery,
    hide: hideErrorRecovery,
    retry: function() {
      hideErrorRecovery();
      // 触发重新执行
      if (typeof window.startCreation === 'function') {
        window.startCreation();
      } else if (typeof window.runStepReal === 'function') {
        // 尝试从当前步骤重新开始
        var step = window.currentStep || 1;
        var idea = document.getElementById('ideaInput')?.value || '';
        window.runStepReal(step, idea);
      }
      showAgentExecution({ agent: '系统', skill: '重试执行', version: '1.0', stepKey: '_default' });
    },
    resumeFromCheckpoint: function() {
      hideErrorRecovery();
      // 尝试从 checkpoint 恢复
      var checkpoint = 0;
      try {
        var session = JSON.parse(localStorage.getItem('yunjiang_active_session_v4') || 'null');
        if (session && session.checkpoint) checkpoint = session.checkpoint;
      } catch(e) {}
      if (checkpoint && typeof window.runStepReal === 'function') {
        var idea = document.getElementById('ideaInput')?.value || '';
        window.runStepReal(checkpoint, idea);
        showAgentExecution({ agent: '系统', skill: '检查点恢复', version: '1.0', stepKey: '_default' });
      } else {
        showErrorRecovery({ message: '未找到可用的检查点，请使用重新执行' });
      }
    }
  };

  /* ============================================================
   *  §14  导出增强
   * ============================================================ */
  function installExportEnhancement() {
    // 拦截成果中心的导出按钮
    var observer = new MutationObserver(function(mutations) {
      var exportBtn = document.getElementById('yj-ach-export');
      if (exportBtn && !exportBtn.dataset.yjEnhanced) {
        exportBtn.dataset.yjEnhanced = 'true';
        var origClick = exportBtn.onclick;
        exportBtn.onclick = function(e) {
          e.preventDefault();
          showExportModal();
        };
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 如果按钮已存在，直接增强
    var exportBtn = document.getElementById('yj-ach-export');
    if (exportBtn && !exportBtn.dataset.yjEnhanced) {
      exportBtn.dataset.yjEnhanced = 'true';
      exportBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showExportModal();
      });
    }
  }

  function showExportModal() {
    var overlay = getOrCreateExportModal();
    overlay.classList.add('visible');
  }

  function hideExportModal() {
    var overlay = document.getElementById('yj-export-overlay');
    if (overlay) overlay.classList.remove('visible');
  }

  var selectedExportFormat = 'markdown';

  function getOrCreateExportModal() {
    var overlay = document.getElementById('yj-export-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'yj-export-modal-overlay';
    overlay.id = 'yj-export-overlay';
    overlay.innerHTML =
      '<div class="yj-export-modal">' +
        '<h3>📦 导出完整项目</h3>' +
        '<p class="yj-export-modal-subtitle">选择导出格式，包含完整的项目数据</p>' +
        '<div class="yj-export-format-grid">' +
          '<div class="yj-export-format-card selected" data-format="markdown" onclick="window.YJExport.selectFormat(\'markdown\')">' +
            '<div class="yj-export-fmt-icon">📝</div>' +
            '<div class="yj-export-fmt-name">Markdown</div>' +
            '<div class="yj-export-fmt-desc">格式美观，适合阅读与分享</div>' +
          '</div>' +
          '<div class="yj-export-format-card" data-format="json" onclick="window.YJExport.selectFormat(\'json\')">' +
            '<div class="yj-export-fmt-icon">🔧</div>' +
            '<div class="yj-export-fmt-name">JSON</div>' +
            '<div class="yj-export-fmt-desc">结构化数据，适合程序处理</div>' +
          '</div>' +
        '</div>' +
        '<div class="yj-export-content-list">' +
          '<h4>导出内容包含：</h4>' +
          '<div class="yj-export-content-item">创作需求与核心创意</div>' +
          '<div class="yj-export-content-item">人物档案与角色设定</div>' +
          '<div class="yj-export-content-item">故事大纲与分集规划</div>' +
          '<div class="yj-export-content-item">分集剧本正文</div>' +
          '<div class="yj-export-content-item">质量审核报告</div>' +
        '</div>' +
        '<div class="yj-export-modal-actions">' +
          '<button class="yj-export-modal-btn yj-export-cancel" onclick="window.YJExport.hide()">取消</button>' +
          '<button class="yj-export-modal-btn yj-export-confirm" onclick="window.YJExport.doExport()">确认导出</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // 点击背景关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) hideExportModal();
    });
    return overlay;
  }

  function selectFormat(fmt) {
    selectedExportFormat = fmt;
    document.querySelectorAll('.yj-export-format-card').forEach(function(card) {
      card.classList.toggle('selected', card.getAttribute('data-format') === fmt);
    });
  }

  function gatherProjectData() {
    // 从全局变量和 DOM 中收集项目数据
    var data = {
      schema: 'yunjiang.drama.export.v1.0',
      exportedAt: new Date().toISOString(),
      title: '',
      idea: '',
      characters: '',
      outline: '',
      episodes: '',
      qualityReport: ''
    };

    // 尝试从 generatedResults 获取
    if (window.generatedResults) {
      var gr = window.generatedResults;
      data.idea = gr[1] || '';
      data.characters = gr[5] || gr[4] || '';
      data.outline = gr[6] || '';
      data.episodes = gr[7] || '';
      data.qualityReport = gr[17] || '';
    }

    // 补充从 DOM 获取
    var ideaInput = document.getElementById('ideaInput');
    if (ideaInput && !data.idea) data.idea = ideaInput.value;

    // 标题
    var projectName = '';
    try {
      var session = JSON.parse(localStorage.getItem('yunjiang_active_session_v4') || 'null');
      if (session) {
        projectName = session.projectName || '';
        if (!data.idea && session.idea) data.idea = session.idea;
      }
    } catch(e) {}
    data.title = projectName || (data.idea ? data.idea.slice(0, 40) : '未命名项目');

    return data;
  }

  function exportMarkdown(data) {
    var lines = [];
    lines.push('# ' + (data.title || '未命名项目'));
    lines.push('');
    lines.push('> 由云匠智能精品短剧引擎自动生成');
    lines.push('> 导出时间：' + new Date().toLocaleString('zh-CN'));
    lines.push('');
    lines.push('---');
    lines.push('');

    // 创作需求
    lines.push('## 📋 创作需求');
    lines.push('');
    lines.push(data.idea || '_暂无内容_');
    lines.push('');

    // 人物档案
    lines.push('## 🎭 人物档案');
    lines.push('');
    if (data.characters) {
      var charLines = data.characters.split('\n').filter(Boolean);
      charLines.forEach(function(line) {
        line = line.trim();
        if (line) {
          var parts = line.split(/[｜|：:]/);
          if (parts.length >= 2) {
            lines.push('### ' + parts[0].trim());
            lines.push('');
            lines.push(parts.slice(1).join(' | ').trim());
            lines.push('');
          } else {
            lines.push('- ' + line);
          }
        }
      });
    } else {
      lines.push('_暂无内容_');
      lines.push('');
    }

    // 故事大纲
    lines.push('## 📖 故事大纲');
    lines.push('');
    lines.push(data.outline || '_暂无内容_');
    lines.push('');

    // 分集剧本
    lines.push('## 🎬 分集剧本');
    lines.push('');
    lines.push(data.episodes || '_暂无内容_');
    lines.push('');

    // 质量报告
    lines.push('## 🔍 质量审核报告');
    lines.push('');
    lines.push(data.qualityReport || '_暂无内容_');
    lines.push('');
    lines.push('---');
    lines.push('*本文档由云匠引擎自动导出*');

    var content = lines.join('\n');
    downloadFile(content, '云匠项目_' + (data.title || '未命名') + '.md', 'text/markdown;charset=utf-8');
  }

  function exportJSON(data) {
    var content = JSON.stringify(data, null, 2);
    downloadFile(content, '云匠项目_' + (data.title || '未命名') + '.json', 'application/json;charset=utf-8');
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 200);
  }

  async function doExport() {
    // 优先尝试从后端通过workflow_id导出
    var workflowId = null;
    if (typeof currentProject !== 'undefined' && currentProject && currentProject.workflow_id) {
      workflowId = currentProject.workflow_id;
    }
    if (!workflowId && typeof window.YJBackendBridge !== 'undefined' && window.YJBackendBridge && window.YJBackendBridge.workflowId) {
      workflowId = window.YJBackendBridge.workflowId;
    }
    // 尝试从localStorage获取
    if (!workflowId) {
      try {
        var cp = JSON.parse(localStorage.getItem('yj_current_project') || 'null');
        if (cp && cp.workflow_id) workflowId = cp.workflow_id;
      } catch(e) {}
    }

    if (!workflowId) {
      hideExportModal();
      if (typeof showToast === 'function') {
        showToast('请先开始创作，再导出项目');
      }
      return;
    }

    // 尝试从后端获取完整结果
    hideExportModal();
    if (typeof showToast === 'function') showToast('正在从服务端获取项目数据...');

    try {
      var baseUrl = '';
      if (typeof window.YJBackendBridge !== 'undefined' && window.YJBackendBridge && window.YJBackendBridge.base) {
        baseUrl = window.YJBackendBridge.base;
      }
      var resp = await fetch(baseUrl + '/api/v1/result/' + workflowId);
      if (resp.ok) {
        var serverData = await resp.json();
        var data = gatherProjectData();
        // 合并后端数据
        if (serverData) {
          data.serverResult = serverData;
          if (serverData.title || serverData.story_direction) {
            data.title = serverData.title || data.title;
            data.idea = serverData.story_direction || data.idea;
          }
        }
        if (selectedExportFormat === 'markdown') {
          exportMarkdown(data);
        } else {
          exportJSON(data);
        }
        if (typeof showToast === 'function') {
          showToast('已导出 ' + selectedExportFormat.toUpperCase() + ' 格式项目文件');
        }
        return;
      }
    } catch(e) {
      console.warn('[YJ] 后端导出失败，使用本地数据', e);
    }

    // 降级：使用本地数据导出
    var data = gatherProjectData();
    if (selectedExportFormat === 'markdown') {
      exportMarkdown(data);
    } else {
      exportJSON(data);
    }
    if (typeof showToast === 'function') {
      showToast('已导出 ' + selectedExportFormat.toUpperCase() + ' 格式项目文件（本地数据）');
    }
  }

  window.YJExport = {
    selectFormat: selectFormat,
    hide: hideExportModal,
    show: showExportModal,
    doExport: doExport,
    gatherData: gatherProjectData
  };

  /* ============================================================
   *  §11  HITL 人机协作面板
   * ============================================================ */
  function showHITLPanel(info) {
    var panel = getOrCreateHITLPanel();
    if (!panel) return;

    // 更新阶段名称
    var stageEl = panel.querySelector('.yj-hitl-stage-name');
    if (stageEl) stageEl.textContent = info.stageName || '检查点';

    // 重置子面板
    var fbArea = panel.querySelector('.yj-hitl-feedback-area');
    var editArea = panel.querySelector('.yj-hitl-edit-area');
    var resubmitBtn = panel.querySelector('.yj-hitl-resubmit');
    if (fbArea) fbArea.classList.remove('visible');
    if (editArea) editArea.classList.remove('visible');
    if (resubmitBtn) resubmitBtn.classList.remove('visible');

    // 存储当前信息
    panel.dataset.stepNum = info.stepNum || '';
    panel.dataset.stageName = info.stageName || '';
    panel.dataset.content = info.content || '';

    panel.classList.add('visible');

    // 触发全局事件
    window.dispatchEvent(new CustomEvent('yj-hitl-show', { detail: info }));
  }

  function hideHITLPanel() {
    var panel = document.getElementById('yj-hitl-panel');
    if (panel) panel.classList.remove('visible');
  }

  function getOrCreateHITLPanel() {
    var panel = document.getElementById('yj-hitl-panel');
    if (panel) return panel;
    var anchor = document.querySelector('.modern-input-card') ||
                 document.querySelector('.canvas-card') ||
                 document.querySelector('#yj-project-root');
    if (!anchor) return null;
    panel = document.createElement('div');
    panel.className = 'yj-hitl-panel';
    panel.id = 'yj-hitl-panel';
    panel.innerHTML =
      '<div class="yj-hitl-header">' +
        '<span class="yj-hitl-stage-name">检查点</span>' +
        '<span> 完成，请选择操作</span>' +
      '</div>' +
      '<div class="yj-hitl-actions">' +
        '<button class="yj-hitl-btn yj-hitl-approve" onclick="window.YJHITL.approve()">✅ 通过并继续</button>' +
        '<button class="yj-hitl-btn yj-hitl-feedback" onclick="window.YJHITL.showFeedback()">💬 提出修改意见</button>' +
        '<button class="yj-hitl-btn yj-hitl-edit" onclick="window.YJHITL.showEdit()">✏️ 手动编辑</button>' +
        '<button class="yj-hitl-btn yj-hitl-resubmit" onclick="window.YJHITL.resubmit()">🔄 重新审核</button>' +
      '</div>' +
      '<div class="yj-hitl-feedback-area">' +
        '<textarea class="yj-hitl-textarea" id="yj-hitl-feedback-input" placeholder="请输入您的修改意见..."></textarea>' +
        '<div class="yj-hitl-inline-actions">' +
          '<button class="yj-hitl-btn yj-hitl-approve" onclick="window.YJHITL.submitFeedback()">提交意见并继续</button>' +
          '<button class="yj-hitl-btn yj-hitl-feedback" onclick="window.YJHITL.cancelFeedback()">取消</button>' +
        '</div>' +
      '</div>' +
      '<div class="yj-hitl-edit-area">' +
        '<textarea class="yj-hitl-textarea" id="yj-hitl-edit-input" placeholder="在此直接修改内容..."></textarea>' +
        '<div class="yj-hitl-inline-actions">' +
          '<button class="yj-hitl-btn yj-hitl-approve" onclick="window.YJHITL.submitEdit()">保存并继续</button>' +
          '<button class="yj-hitl-btn yj-hitl-edit" onclick="window.YJHITL.cancelEdit()">取消</button>' +
        '</div>' +
      '</div>';
    anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    return panel;
  }

  // HITL API
  window.YJHITL = {
    show: showHITLPanel,
    hide: hideHITLPanel,
    approve: function() {
      var panel = document.getElementById('yj-hitl-panel');
      var stepNum = panel ? parseInt(panel.dataset.stepNum) : 0;
      hideHITLPanel();
      // 继续执行下一步
      if (typeof window.stepResolve === 'function') {
        window.stepResolve('approved');
      } else if (typeof window.runStepReal === 'function' && stepNum) {
        var idea = document.getElementById('ideaInput')?.value || '';
        window.runStepReal(stepNum + 1, idea);
      }
      window.dispatchEvent(new CustomEvent('yj-hitl-approved', { detail: { stepNum: stepNum } }));
    },
    showFeedback: function() {
      var panel = document.getElementById('yj-hitl-panel');
      if (!panel) return;
      panel.querySelector('.yj-hitl-feedback-area').classList.add('visible');
      panel.querySelector('.yj-hitl-edit-area').classList.remove('visible');
      var input = document.getElementById('yj-hitl-feedback-input');
      if (input) input.focus();
    },
    cancelFeedback: function() {
      var panel = document.getElementById('yj-hitl-panel');
      if (!panel) return;
      panel.querySelector('.yj-hitl-feedback-area').classList.remove('visible');
      var input = document.getElementById('yj-hitl-feedback-input');
      if (input) input.value = '';
    },
    submitFeedback: function() {
      var input = document.getElementById('yj-hitl-feedback-input');
      var feedback = input ? input.value.trim() : '';
      if (!feedback) { if (typeof showToast === 'function') showToast('请输入修改意见'); return; }
      var panel = document.getElementById('yj-hitl-panel');
      // 显示重新审核按钮
      var resubmitBtn = panel.querySelector('.yj-hitl-resubmit');
      if (resubmitBtn) resubmitBtn.classList.add('visible');
      panel.querySelector('.yj-hitl-feedback-area').classList.remove('visible');
      window.dispatchEvent(new CustomEvent('yj-hitl-feedback', {
        detail: { stepNum: parseInt(panel.dataset.stepNum), feedback: feedback }
      }));
      if (typeof showToast === 'function') showToast('修改意见已提交');
    },
    showEdit: function() {
      var panel = document.getElementById('yj-hitl-panel');
      if (!panel) return;
      var editArea = panel.querySelector('.yj-hitl-edit-area');
      editArea.classList.add('visible');
      panel.querySelector('.yj-hitl-feedback-area').classList.remove('visible');
      var input = document.getElementById('yj-hitl-edit-input');
      if (input) {
        input.value = panel.dataset.content || '';
        input.focus();
      }
    },
    cancelEdit: function() {
      var panel = document.getElementById('yj-hitl-panel');
      if (!panel) return;
      panel.querySelector('.yj-hitl-edit-area').classList.remove('visible');
    },
    submitEdit: function() {
      var input = document.getElementById('yj-hitl-edit-input');
      var panel = document.getElementById('yj-hitl-panel');
      var stepNum = parseInt(panel.dataset.stepNum);
      var content = input ? input.value.trim() : '';
      if (!content) { if (typeof showToast === 'function') showToast('编辑内容不能为空'); return; }
      // 更新生成的结果
      if (window.generatedResults && stepNum) {
        window.generatedResults[stepNum] = content;
      }
      // 显示重新审核按钮
      var resubmitBtn = panel.querySelector('.yj-hitl-resubmit');
      if (resubmitBtn) resubmitBtn.classList.add('visible');
      panel.querySelector('.yj-hitl-edit-area').classList.remove('visible');
      window.dispatchEvent(new CustomEvent('yj-hitl-edited', {
        detail: { stepNum: stepNum, content: content }
      }));
      if (typeof showToast === 'function') showToast('内容已保存，可点击"重新审核"');
      if (typeof saveSession === 'function') saveSession();
    },
    resubmit: function() {
      var panel = document.getElementById('yj-hitl-panel');
      var stepNum = parseInt(panel.dataset.stepNum);
      hideHITLPanel();
      // 重新执行当前步骤
      if (typeof window.runStepReal === 'function' && stepNum) {
        var idea = document.getElementById('ideaInput')?.value || '';
        window.runStepReal(stepNum, idea);
      }
      window.dispatchEvent(new CustomEvent('yj-hitl-resubmit', { detail: { stepNum: stepNum } }));
    }
  };

  /* ============================================================
   *  §16  工作台布局优化
   * ============================================================ */
  function installWorkspaceLayout() {
    if (document.getElementById('yj-workspace-layout')) return;

    var layout = document.createElement('div');
    layout.className = 'yj-workspace-layout';
    layout.id = 'yj-workspace-layout';

    // 左栏
    var leftHTML = '<div class="yj-ws-left">';
    WORKFLOW_STEPS.forEach(function(step, i) {
      var cls = i === 0 ? 'yj-ws-step active' : 'yj-ws-step';
      leftHTML += '<div class="' + cls + '" data-step="' + step.key + '" onclick="window.YJWorkspace.goToStep(\'' + step.key + '\')">' +
        '<div class="yj-ws-step-icon">' + step.icon + '</div>' +
        '<div class="yj-ws-step-label">' + step.label + '</div>' +
        (i < WORKFLOW_STEPS.length - 1 ? '<div class="yj-ws-step-connector"></div>' : '') +
      '</div>';
    });
    leftHTML += '</div>';

    // 中栏
    var centerHTML = '<div class="yj-ws-center">' +
      '<div class="yj-ws-center-title" id="yj-ws-center-title">💡 创作需求</div>' +
      '<div id="yj-ws-center-content">在此区域查看和编辑当前阶段的创作内容</div>' +
    '</div>';

    // 右栏
    var rightHTML = '<div class="yj-ws-right">' +
      '<div class="yj-ws-info-block">' +
        '<div class="yj-ws-info-title">Agent 状态</div>' +
        '<div id="yj-ws-agents"></div>' +
      '</div>' +
      '<div class="yj-ws-info-block">' +
        '<div class="yj-ws-info-title">当前 Skill</div>' +
        '<div id="yj-ws-skills" style="font-size:12px;color:#64748b;">等待分配</div>' +
      '</div>' +
      '<div class="yj-ws-info-block">' +
        '<div class="yj-ws-info-title">质量指标</div>' +
        '<div id="yj-ws-quality" style="font-size:12px;color:#64748b;">暂无数据</div>' +
        '<div class="yj-ws-quality-bar"><div class="yj-ws-quality-fill" id="yj-ws-quality-fill" style="width:0%"></div></div>' +
      '</div>' +
    '</div>';

    layout.innerHTML = leftHTML + centerHTML + rightHTML;

    // 插入到页面
    var mainArea = document.querySelector('.center-main-area') ||
                   document.querySelector('.main-layout') ||
                   document.body;
    mainArea.appendChild(layout);
  }

  function updateWorkspaceStep(stepKey) {
    var steps = document.querySelectorAll('.yj-ws-step');
    var found = false;
    steps.forEach(function(s) {
      var key = s.getAttribute('data-step');
      s.classList.remove('active', 'completed');
      if (key === stepKey) {
        s.classList.add('active');
        found = true;
      } else if (!found) {
        s.classList.add('completed');
      }
    });

    // 更新中栏标题
    var stepInfo = WORKFLOW_STEPS.find(function(s) { return s.key === stepKey; });
    var titleEl = document.getElementById('yj-ws-center-title');
    if (titleEl && stepInfo) {
      titleEl.textContent = stepInfo.icon + ' ' + stepInfo.label;
    }
  }

  function updateWorkspaceAgent(agentName, status) {
    var container = document.getElementById('yj-ws-agents');
    if (!container) return;
    var card = container.querySelector('[data-agent="' + agentName + '"]');
    if (!card) {
      card = document.createElement('div');
      card.className = 'yj-ws-agent-card';
      card.setAttribute('data-agent', agentName);
      card.innerHTML = '<div class="yj-ws-agent-dot"></div><span>' + esc(agentName) + '</span>';
      container.appendChild(card);
    }
    card.className = 'yj-ws-agent-card ' + (status || '');
  }

  function updateWorkspaceQuality(score) {
    var fill = document.getElementById('yj-ws-quality-fill');
    var label = document.getElementById('yj-ws-quality');
    if (fill) fill.style.width = Math.min(100, Math.max(0, score)) + '%';
    if (label) label.textContent = score + '%';
  }

  window.YJWorkspace = {
    show: function() {
      var layout = document.getElementById('yj-workspace-layout');
      if (layout) layout.classList.add('visible');
    },
    hide: function() {
      var layout = document.getElementById('yj-workspace-layout');
      if (layout) layout.classList.remove('visible');
    },
    goToStep: function(stepKey) {
      updateWorkspaceStep(stepKey);
      window.dispatchEvent(new CustomEvent('yj-workspace-step', { detail: { step: stepKey } }));
    },
    updateStep: updateWorkspaceStep,
    updateAgent: updateWorkspaceAgent,
    updateQuality: updateWorkspaceQuality,
    STEPS: WORKFLOW_STEPS
  };

  /* ============================================================
   *  §  钩子：与现有 Agent 执行流程集成
   * ============================================================ */
  function installHooks() {
    // 钩住 runStepReal 来驱动模式显示和工作台更新
    var origRunStepReal = window.runStepReal;
    if (origRunStepReal && !origRunStepReal._yjP1Hooked) {
      window.runStepReal = async function() {
        var stepNum = arguments[0];
        // 映射步骤到 step key
        var stepMap = { 1: 'idea', 2: 'idea', 3: 'idea', 4: 'characters', 5: 'characters',
                        6: 'outline', 7: 'script', 8: 'script', 9: 'script', 10: 'script',
                        11: 'script', 12: 'script', 13: 'script', 14: 'script',
                        15: 'review', 16: 'review', 17: 'review' };
        var stepKey = stepMap[stepNum] || '_default';

        // 显示执行信息
        var agentName = 'Agent-' + stepNum;
        // 尝试从 stepPrompts 获取专家名
        if (window.stepPrompts && window.stepPrompts[stepNum]) {
          agentName = window.stepPrompts[stepNum].expert || window.stepPrompts[stepNum].name || agentName;
        }
        showAgentExecution({
          agent: agentName,
          skill: 'Step ' + stepNum,
          version: '1.0',
          stepKey: stepKey
        });

        // 更新工作台
        updateWorkspaceStep(stepKey);
        updateWorkspaceAgent(agentName, 'working');

        try {
          var result = await origRunStepReal.apply(this, arguments);
          updateWorkspaceAgent(agentName, 'done');
          // 检查是否到达检查点
          if ([4, 6, 7].indexOf(stepNum) >= 0) {
            hideExecutionUI();
            var stageName = { 4: '人物设定', 6: '剧情大纲', 7: '分集剧本' }[stepNum] || '阶段';
            showHITLPanel({
              stepNum: stepNum,
              stageName: stageName,
              content: (window.generatedResults && window.generatedResults[stepNum]) || ''
            });
          }
          return result;
        } catch(e) {
          updateWorkspaceAgent(agentName, '');
          showErrorRecovery({ message: e.message || '执行出错', source: 'runStepReal' });
          throw e;
        }
      };
      window.runStepReal._yjP1Hooked = true;
    }
  }

  /* ============================================================
   *  §  工具函数
   * ============================================================ */
  function esc(str) {
    return String(str || '').replace(/[&<>]/g, function(c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c];
    });
  }

  /* ============================================================
   *  §  初始化
   * ============================================================ */
  function init() {
    injectP1Styles();
    installModeToggle();
    updateDisplayMode();
    installSSEErrorListener();
    installExportEnhancement();
    installWorkspaceLayout();
    installHooks();

    // DOM 就绪后增强卡片
    setTimeout(function() {
      if (window.YJStatus) window.YJStatus.enhanceCards();
    }, 1000);

    // 定期检查项目卡片
    setInterval(function() {
      if (window.YJStatus) window.YJStatus.enhanceCards();
    }, 3000);
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

