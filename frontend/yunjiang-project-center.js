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

  const EXPERT_KNOWLEDGE_BINDINGS = [
    { id: 'mission_commander', icon: '🧭', name: '实战指挥', role: '总调度与策略优先级', skill: '工作流策略编排', library: '项目决策与生产统筹库' },
    { id: 'project_configurator', icon: '🗂️', name: '项目配置师', role: '集数、受众与平台配置', skill: '短剧项目配置', library: '平台规格与受众画像库' },
    { id: 'soul_catcher', icon: '💠', name: '灵魂捕手', role: '主题与核心情感冲突', skill: '故事灵魂提炼', library: '情感母题与文化原型库' },
    { id: 'character_forger', icon: '🎭', name: '角色铸造师', role: '人物设定与成长弧线', skill: '角色弧线设计', library: '人物心理与关系模型库' },
    { id: 'structure_architect', icon: '🏗️', name: '结构建筑师', role: '叙事结构与关键转折', skill: '剧情结构设计', library: '短剧结构与经典案例库' },
    { id: 'dialogue_master', icon: '💬', name: '对白大师', role: '角色声线与潜台词', skill: '对白声线设计', library: '方言口语与台词语料库' },
    { id: 'scene_craftsman', icon: '🎬', name: '场景工匠', role: '场景动作与可拍化', skill: '场景可拍化', library: '场景调度与制作条件库' },
    { id: 'compliance_guard', icon: '🛡️', name: '合规守门员', role: '内容红线与平台风险', skill: '内容合规审查', library: '平台规则与文化合规库' },
    { id: 'episode_writer', icon: '✍️', name: '分集编剧', role: '分集正文与结尾钩子', skill: '分集剧本生成', library: '精品短剧剧本样本库' },
    { id: 'format_craftsman', icon: '📐', name: '格式工匠', role: '标准剧本格式交付', skill: '剧本格式标准化', library: '影视剧本格式规范库' },
    { id: 'visual_director', icon: '🎥', name: '视觉导演', role: '镜头语言与视觉母题', skill: '视觉叙事设计', library: '分镜与视听语言资料库' },
    { id: 'episode_outline_reviewer', icon: '🧩', name: '集纲审核', role: '连续性与推进效率', skill: '集纲结构审核', library: '集纲结构与钩子案例库' },
    { id: 'quality_auditor', icon: '📊', name: '质量审计', role: '多维评分与问题定位', skill: '多维质量审计', library: '卡卡星评分与标杆样本库' },
    { id: 'revision_editor', icon: '🛠️', name: '改稿编辑', role: '定向返工与回归验证', skill: '定向改稿', library: '缺陷归因与改稿经验库' },
    { id: 'script_reviewer', icon: '🔎', name: '剧本审核', role: '人物、因果与可拍性终审', skill: '剧本生产审核', library: '终审清单与生产标准库' },
    { id: 'business_strategist', icon: '📈', name: '商业操盘', role: '市场定位与发行策略', skill: '商业定位评估', library: '市场趋势与平台商业库' },
    { id: 'quality_director', icon: '✅', name: '品控总监', role: '质量门禁与最终签发', skill: '终审签发', library: 'A+交付标准与风险库' }
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
      /* 原工作室消息不能被项目中心固定顶栏遮挡 */
      .error-toast {
        top: 76px !important;
        z-index: 30000 !important;
        max-width: calc(100vw - 32px);
        text-align: center;
        box-shadow: 0 10px 30px rgba(15,23,42,0.18);
        animation: yjSafeToastSlideDown 0.3s ease !important;
      }
      @keyframes yjSafeToastSlideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      .node-complete-popup {
        z-index: 30000 !important;
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
      .yj-workspace-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 14px;
        border: 1px solid rgba(139,92,246,0.2);
        border-radius: 12px;
        background: rgba(255,255,255,0.62);
        color: #51479a;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 7px 22px rgba(76,63,145,0.1);
        backdrop-filter: blur(18px) saturate(1.4);
        -webkit-backdrop-filter: blur(18px) saturate(1.4);
        font: 650 12px/1 'Noto Sans SC', -apple-system, sans-serif;
        white-space: nowrap;
        cursor: pointer;
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }
      .yj-workspace-back-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(124,92,246,0.42);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 10px 28px rgba(76,63,145,0.15);
      }
      [data-theme="dark"] .yj-workspace-back-btn {
        border-color: rgba(167,139,250,0.28);
        background: rgba(30,27,55,0.68);
        color: #ddd6fe;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.2);
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

      /* ========== 双工作台门户 ========== */
      .yj-project-home.yj-studio-portal{max-width:1180px;padding-top:42px;text-align:left}
      .yj-studio-portal-head{text-align:center;max-width:760px;margin:0 auto 30px}.yj-studio-portal-head h1{font-size:40px}.yj-studio-portal-head .yj-subtitle{margin-bottom:12px}.yj-studio-portal-head p:last-child{margin:0;color:#94a3b8;font-size:13px}
      .yj-workbench-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:24px 0 22px}.yj-workbench-card{position:relative;min-height:300px;padding:26px;border:1px solid rgba(255,255,255,.85);border-radius:24px;overflow:hidden;background:rgba(255,255,255,.68);box-shadow:0 18px 52px rgba(58,68,104,.08),inset 0 1px rgba(255,255,255,.96);backdrop-filter:blur(24px) saturate(1.2);transition:.25s ease}.yj-workbench-card:hover{transform:translateY(-3px);box-shadow:0 24px 60px rgba(58,68,104,.13)}.yj-workbench-card:before{content:'';position:absolute;width:220px;height:220px;border-radius:50%;right:-70px;top:-80px;filter:blur(2px);opacity:.7}.yj-workbench-card.original:before{background:radial-gradient(circle,rgba(112,112,246,.19),transparent 68%)}.yj-workbench-card.adaptation:before{background:radial-gradient(circle,rgba(61,183,149,.2),transparent 68%)}.yj-workbench-card.global:before{background:radial-gradient(circle,rgba(53,142,224,.2),transparent 68%)}
      .yj-workbench-eyebrow{display:flex;align-items:center;justify-content:space-between;color:#7b72c8;font-size:10px;font-weight:800;letter-spacing:1.2px}.yj-workbench-card.adaptation .yj-workbench-eyebrow{color:#29967b}.yj-workbench-card.global .yj-workbench-eyebrow{color:#347cba}.yj-workbench-number{font-size:10px;padding:5px 8px;border-radius:8px;background:rgba(119,105,226,.08)}.yj-workbench-card h2{position:relative;margin:18px 0 8px;color:#1f2937;font-size:24px}.yj-workbench-card>p{position:relative;max-width:460px;min-height:44px;margin:0;color:#718096;font-size:12px;line-height:1.7}.yj-workbench-flow{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:18px 0}.yj-workbench-flow span{padding:6px 8px;border-radius:8px;background:rgba(246,246,252,.85);color:#687386;font-size:9px;font-weight:700}.yj-workbench-flow i{color:#b2b8c5;font:normal 9px/1 sans-serif}.yj-workbench-actions{display:flex;gap:8px;flex-wrap:wrap}.yj-workbench-actions .yj-home-btn{padding:10px 16px;font-size:12px}.yj-home-btn-adapt{color:#147f68;border:1px solid rgba(38,175,139,.22);background:rgba(230,249,243,.78)}.yj-home-btn-adapt:hover{background:rgba(216,246,237,.95)}.yj-home-btn-global{color:#246da9;border:1px solid rgba(55,135,204,.22);background:rgba(232,244,255,.82)}.yj-home-btn-global:hover{background:rgba(218,238,255,.96)}
      .yj-adaptation-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.yj-adapt-mode{display:flex;gap:10px;align-items:center;padding:11px;border:1px solid rgba(54,171,141,.14);border-radius:12px;background:rgba(245,252,250,.74)}.yj-adapt-mode i{font-style:normal;font-size:18px}.yj-adapt-mode b,.yj-adapt-mode small{display:block}.yj-adapt-mode b{font-size:11px;color:#344256}.yj-adapt-mode small{margin-top:2px;color:#8b97a7;font-size:9px}
      .yj-portal-utility{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.yj-portal-utility button{display:flex;align-items:center;gap:10px;padding:13px 15px;border:1px solid rgba(148,163,184,.13);border-radius:14px;background:rgba(255,255,255,.55);color:#657184;cursor:pointer;text-align:left}.yj-portal-utility button:hover{border-color:rgba(118,101,224,.25);background:rgba(255,255,255,.82)}.yj-portal-utility i{font-style:normal;font-size:18px}.yj-portal-utility b,.yj-portal-utility small{display:block}.yj-portal-utility b{font-size:11px;color:#344156}.yj-portal-utility small{margin-top:2px;color:#99a2b1;font-size:9px}
      .yj-project-type-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.yj-project-type-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:9px;background:#f2f1ff;color:#6a5bd0;font-size:10px;font-weight:800}.yj-project-type-pill.literary{background:#eaf8f3;color:#207d68}.yj-project-type-pill.manga{background:#edf2ff;color:#4e68b8}
      .yj-project-type-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:13px 0 16px}.yj-project-type-option{position:relative;display:block;cursor:pointer}.yj-project-type-option input{position:absolute;opacity:0}.yj-project-type-option span{display:block;min-height:74px;padding:11px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(249,250,252,.78);color:#657184}.yj-project-type-option b,.yj-project-type-option small{display:block}.yj-project-type-option b{font-size:11px;color:#344156}.yj-project-type-option small{margin-top:5px;font-size:9px;line-height:1.45}.yj-project-type-option input:checked+span{border-color:rgba(110,93,225,.38);background:linear-gradient(145deg,#f4f2ff,#eff7ff);box-shadow:0 7px 18px rgba(92,82,191,.1)}
      .yj-demo-hub{max-width:1080px;margin:0 auto;padding:32px 24px 80px}.yj-demo-hero{text-align:center;margin-bottom:25px}.yj-demo-hero h2{margin:0 0 7px;font-size:25px}.yj-demo-hero p{margin:0;color:#8994a6;font-size:12px}.yj-demo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.yj-demo-card{padding:20px;border:1px solid rgba(255,255,255,.82);border-radius:19px;background:rgba(255,255,255,.68);box-shadow:0 12px 36px rgba(62,72,104,.07);backdrop-filter:blur(20px)}.yj-demo-card .icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#eeebff,#eaf5ff);font-size:20px}.yj-demo-card h3{margin:13px 0 6px;font-size:15px}.yj-demo-card p{min-height:52px;margin:0;color:#8490a3;font-size:10px;line-height:1.65}.yj-demo-card ul{min-height:70px;margin:13px 0;padding:0;list-style:none;color:#667286;font-size:9px;line-height:1.8}.yj-demo-card button{width:100%;justify-content:center;padding:10px 12px;font-size:11px}
      [data-theme="dark"] .yj-workbench-card,[data-theme="dark"] .yj-demo-card{background:rgba(25,35,53,.72);border-color:rgba(152,163,190,.12)}[data-theme="dark"] .yj-workbench-card h2,[data-theme="dark"] .yj-adapt-mode b,[data-theme="dark"] .yj-portal-utility b,[data-theme="dark"] .yj-project-type-option b,[data-theme="dark"] .yj-demo-card h3{color:#edf2f8}[data-theme="dark"] .yj-workbench-flow span,[data-theme="dark"] .yj-adapt-mode,[data-theme="dark"] .yj-portal-utility button,[data-theme="dark"] .yj-project-type-option span{background:rgba(29,40,60,.78);color:#aab6c8}[data-theme="dark"] .yj-project-type-option input:checked+span{background:linear-gradient(145deg,#272447,#1c344a)}

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
      .yj-project-card-titleline{display:flex;align-items:center;gap:9px;min-width:0}.yj-project-card-titleline .yj-project-card-name{max-width:none}
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
      .yj-ach-type-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:18px}.yj-ach-type-summary span{padding:12px;border:1px solid rgba(148,163,184,.12);border-radius:12px;background:rgba(255,255,255,.58)}.yj-ach-type-summary b,.yj-ach-type-summary small{display:block}.yj-ach-type-summary b{font-size:11px;color:#3b4759}.yj-ach-type-summary small{margin-top:4px;color:#929cad;font-size:9px}[data-theme="dark"] .yj-ach-type-summary span{background:rgba(30,41,59,.55)}[data-theme="dark"] .yj-ach-type-summary b{color:#e5eaf2}
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
        width: 560px;
        max-width: 92vw;
        max-height: 86vh;
        overflow-y: auto;
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
        margin: 0 0 4px;
        color: #0f172a;
      }
      .yj-project-modal-subtitle { margin: 0 0 20px; color: #8b95a7; font-size: 12px; line-height: 1.6; }
      .yj-project-mode-badge {
        display: inline-flex; align-items: center; gap: 6px; margin-bottom: 9px; padding: 5px 9px;
        border: 1px solid rgba(124,110,230,.16); border-radius: 999px;
        background: rgba(124,110,230,.07); color: #6759c7; font-size: 10px; font-weight: 750;
      }
      [data-theme="dark"] .yj-project-modal h3 { color: #f1f5f9; }
      .yj-project-modal input, .yj-project-modal textarea, .yj-project-modal select {
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
      [data-theme="dark"] .yj-project-modal textarea,
      [data-theme="dark"] .yj-project-modal select {
        background: rgba(15,23,42,0.5);
        color: #f1f5f9;
        border-color: rgba(139,92,246,0.15);
      }
      .yj-project-modal input:focus, .yj-project-modal textarea:focus, .yj-project-modal select:focus {
        border-color: rgba(139,92,246,0.5);
      }
      .yj-project-modal textarea { min-height: 100px; resize: vertical; }
      .yj-project-form-label { display:block; margin: 1px 0 7px; color:#596579; font-size:11px; font-weight:700; }
      .yj-auto-config-card {
        display: none; margin: 2px 0 14px; padding: 13px 14px; border: 1px solid rgba(94,200,171,.2);
        border-radius: 14px; background: linear-gradient(135deg,rgba(236,253,247,.72),rgba(245,243,255,.7));
        color: #667085; font-size: 11px; line-height: 1.75;
      }
      .yj-auto-config-card b { display:block; color:#315f55; font-size:12px; }
      .yj-pro-project-fields { display:none; margin: 4px 0 12px; padding: 14px; border:1px solid rgba(124,110,230,.13); border-radius:16px; background:rgba(248,247,255,.68); }
      .yj-pro-project-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 10px; }
      .yj-pro-project-grid > label { min-width:0; }
      .yj-pro-project-fields textarea { min-height:68px; margin-bottom:0; }
      body[data-yj-mode="normal"] .yj-auto-config-card { display:block; }
      body[data-yj-mode="pro"] .yj-pro-project-fields { display:block; }
      body[data-yj-mode="pro"] .yj-project-modal { width: 680px; }
      .yj-project-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
      }
      @media (max-width: 640px) { .yj-pro-project-grid { grid-template-columns:1fr; } }

      /* ========== 专家智库（只读展示） ========== */
      .yj-knowledge-wrap {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
        padding: 30px 0 64px;
      }
      .yj-knowledge-hero {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        padding: 24px 26px;
        margin-bottom: 18px;
        border: 1px solid rgba(255,255,255,0.82);
        border-radius: 22px;
        background: linear-gradient(135deg, rgba(255,255,255,0.78), rgba(245,243,255,0.62));
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.94), 0 16px 45px rgba(75,65,130,0.08);
        backdrop-filter: blur(22px) saturate(1.35);
        -webkit-backdrop-filter: blur(22px) saturate(1.35);
      }
      .yj-knowledge-eyebrow {
        color: #7c6ee6;
        font-size: 11px;
        font-weight: 750;
        letter-spacing: 1.6px;
      }
      .yj-knowledge-hero h2 { margin: 7px 0 6px; color: #25324a; font-size: 25px; }
      .yj-knowledge-hero p { margin: 0; max-width: 690px; color: #718096; font-size: 13px; line-height: 1.7; }
      .yj-knowledge-stats { display: flex; gap: 9px; flex-shrink: 0; }
      .yj-knowledge-stats span {
        min-width: 82px;
        padding: 11px 13px;
        border: 1px solid rgba(139,92,246,0.11);
        border-radius: 14px;
        background: rgba(255,255,255,0.6);
        color: #7a869b;
        text-align: center;
        font-size: 11px;
      }
      .yj-knowledge-stats b { display: block; margin-bottom: 2px; color: #4f46a5; font-size: 19px; }
      .yj-knowledge-legend {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 0 4px 16px;
        color: #8995a9;
        font-size: 11px;
      }
      .yj-knowledge-legend span { display: inline-flex; align-items: center; gap: 6px; }
      .yj-knowledge-legend i { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; }
      .yj-knowledge-legend .running i { background: #8b5cf6; box-shadow: 0 0 0 5px rgba(139,92,246,0.1); }
      .yj-knowledge-legend .done i { background: #10b981; }
      .yj-knowledge-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 13px;
      }
      .yj-knowledge-card {
        position: relative;
        min-height: 188px;
        padding: 17px;
        overflow: hidden;
        border: 1px solid rgba(203,213,225,0.5);
        border-radius: 18px;
        background: rgba(255,255,255,0.68);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.94), 0 8px 25px rgba(65,75,105,0.055);
        backdrop-filter: blur(19px) saturate(1.25);
        -webkit-backdrop-filter: blur(19px) saturate(1.25);
        cursor: default;
        user-select: none;
        transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
      }
      .yj-knowledge-card::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(115deg, rgba(255,255,255,0.35), transparent 38%);
      }
      .yj-knowledge-card-head { position: relative; z-index: 1; display: flex; align-items: center; gap: 11px; }
      .yj-knowledge-avatar {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        border: 1px solid rgba(139,92,246,0.12);
        border-radius: 13px;
        background: linear-gradient(145deg, rgba(239,235,255,0.92), rgba(231,241,255,0.8));
        font-size: 20px;
      }
      .yj-knowledge-card-head b { display: block; color: #27334a; font-size: 15px; }
      .yj-knowledge-card-head small { display: block; margin-top: 3px; color: #8a97aa; font-size: 11px; }
      .yj-knowledge-state {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #9aa5b5;
        font-size: 10px;
        font-style: normal;
      }
      .yj-knowledge-state i { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; }
      .yj-knowledge-bind {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: stretch;
        gap: 7px;
        margin-top: 15px;
      }
      .yj-knowledge-bind > div {
        min-width: 0;
        padding: 10px;
        border: 1px solid rgba(203,213,225,0.44);
        border-radius: 12px;
        background: rgba(248,250,252,0.66);
      }
      .yj-knowledge-bind small { display: block; color: #a0aabc; font-size: 9px; letter-spacing: .5px; }
      .yj-knowledge-bind b { display: block; overflow: hidden; margin-top: 4px; color: #59667c; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
      .yj-knowledge-bind > span { align-self: center; color: #b2a9ed; font-size: 12px; }
      .yj-knowledge-readonly {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 11px;
        color: #a0aabc;
        font-size: 10px;
      }
      .yj-knowledge-readonly span:last-child { color: #8b7ee0; }
      .yj-knowledge-card.working {
        border-color: rgba(139,92,246,0.58);
        transform: translateY(-2px);
        animation: yjKnowledgeCardBreath 1.8s ease-in-out infinite;
      }
      .yj-knowledge-card.working .yj-knowledge-state { color: #745ee8; font-weight: 700; }
      .yj-knowledge-card.working .yj-knowledge-state i { background: #8b5cf6; animation: yjKnowledgeDotBreath 1.1s ease-in-out infinite; }
      .yj-knowledge-card.done { border-color: rgba(16,185,129,0.24); }
      .yj-knowledge-card.done .yj-knowledge-state { color: #0f9f72; }
      .yj-knowledge-card.done .yj-knowledge-state i { background: #10b981; }
      @keyframes yjKnowledgeCardBreath {
        0%,100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.94), 0 9px 28px rgba(111,84,214,.1), 0 0 0 0 rgba(139,92,246,.12); }
        50% { box-shadow: inset 0 1px 0 rgba(255,255,255,.98), 0 14px 36px rgba(111,84,214,.2), 0 0 0 7px rgba(139,92,246,.06); }
      }
      @keyframes yjKnowledgeDotBreath {
        0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,.38); }
        50% { box-shadow: 0 0 0 7px rgba(139,92,246,0); }
      }
      [data-theme="dark"] .yj-knowledge-hero,
      [data-theme="dark"] .yj-knowledge-card { background: rgba(25,28,48,0.76); border-color: rgba(167,139,250,0.15); }
      [data-theme="dark"] .yj-knowledge-hero h2,
      [data-theme="dark"] .yj-knowledge-card-head b { color: #eef2ff; }
      [data-theme="dark"] .yj-knowledge-bind > div { background: rgba(15,23,42,.46); border-color: rgba(148,163,184,.14); }
      [data-theme="dark"] .yj-knowledge-bind b { color: #cbd5e1; }

      /* ========== 2026 首页精修：安静、清晰、产品化 ========== */
      #yj-page-home {
        background:
          radial-gradient(circle at 18% 4%, rgba(109,94,252,.075), transparent 28%),
          radial-gradient(circle at 82% 10%, rgba(46,142,255,.055), transparent 25%),
          linear-gradient(180deg, #fbfcff 0%, #f7f9fc 64%, #fbfcfe 100%);
      }
      .yj-project-navbar {
        height: 64px;
        padding: 0 clamp(20px, 2.2vw, 42px);
        background: rgba(255,255,255,.9);
        border-bottom-color: rgba(15,23,42,.07);
        box-shadow: 0 1px 0 rgba(15,23,42,.025);
      }
      .yj-project-navbar-brand {
        min-width: 122px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -.35px;
      }
      .yj-project-navbar-nav { gap: 2px; }
      .yj-project-navbar-nav a {
        padding: 8px 11px;
        border-radius: 9px;
        color: #5c6678;
        font-size: 12px;
        font-weight: 560;
      }
      .yj-project-navbar-nav a.yj-nav-active {
        color: #6557d9;
        background: #f0edff;
        box-shadow: inset 0 0 0 1px rgba(101,87,217,.05);
      }
      .yj-project-account-btn,.yj-project-new-btn {
        min-height: 38px;
        border-radius: 11px;
      }
      .yj-project-new-btn {
        padding-inline: 17px;
        background: #6557e8;
        box-shadow: 0 6px 16px rgba(101,87,232,.18);
      }
      .yj-project-page { padding-top: 64px; }
      .yj-project-home.yj-studio-portal {
        max-width: 1240px;
        padding: clamp(44px, 5.2vh, 68px) 28px 64px;
      }
      .yj-studio-portal-head {
        max-width: 820px;
        margin-bottom: 38px;
      }
      .yj-project-home-badge {
        margin-bottom: 18px;
        padding: 6px 13px;
        border: 1px solid rgba(101,87,217,.10);
        background: rgba(244,242,255,.8);
        color: #7568df;
        font-size: 10px;
        font-weight: 750;
        letter-spacing: 1.25px;
      }
      .yj-studio-portal-head h1 {
        margin-bottom: 13px;
        font-size: clamp(38px, 4vw, 54px);
        font-weight: 780;
        letter-spacing: -2.4px;
        background: linear-gradient(105deg,#172033 8%,#3d465b 62%,#6658d4 100%);
        -webkit-background-clip:text;
        background-clip:text;
      }
      .yj-studio-portal-head .yj-subtitle {
        margin-bottom: 10px;
        color: #68758a;
        font-size: 18px;
        letter-spacing: -.2px;
      }
      .yj-studio-portal-head p:last-child {
        color: #9aa5b7;
        font-size: 11px;
        letter-spacing: .18px;
      }
      .yj-workbench-grid {
        grid-template-columns: repeat(3,minmax(0,1fr));
        gap: 16px;
        margin: 0 0 16px;
      }
      .yj-workbench-card {
        min-height: 326px;
        padding: 28px;
        border: 1px solid rgba(15,23,42,.075);
        border-radius: 20px;
        background: rgba(255,255,255,.88);
        box-shadow: 0 14px 38px rgba(35,45,72,.065), inset 0 1px rgba(255,255,255,.9);
        backdrop-filter: blur(18px) saturate(1.08);
        transition: transform .28s cubic-bezier(.2,.8,.2,1), border-color .28s ease, box-shadow .28s ease;
      }
      .yj-workbench-card:hover {
        transform: translateY(-4px);
        border-color: rgba(101,87,217,.16);
        box-shadow: 0 22px 48px rgba(35,45,72,.11), inset 0 1px #fff;
      }
      .yj-workbench-card:before {
        width: 190px;
        height: 190px;
        right: -72px;
        top: -88px;
        opacity: .42;
      }
      .yj-workbench-eyebrow {
        font-size: 9px;
        letter-spacing: 1.45px;
      }
      .yj-workbench-number {
        min-width: 28px;
        padding: 5px 7px;
        text-align: center;
        border-radius: 8px;
      }
      .yj-workbench-card h2 {
        margin: 22px 0 10px;
        color: #182132;
        font-size: clamp(20px,1.65vw,25px);
        letter-spacing: -.65px;
      }
      .yj-workbench-card>p {
        min-height: 62px;
        color: #718096;
        font-size: 11px;
        line-height: 1.8;
      }
      .yj-workbench-flow { gap: 4px; margin: 18px 0 22px; }
      .yj-workbench-flow span {
        padding: 6px 8px;
        border: 1px solid rgba(15,23,42,.035);
        background: #f7f8fb;
        color: #687386;
      }
      .yj-workbench-actions { margin-top: auto; }
      .yj-workbench-actions .yj-home-btn {
        min-height: 39px;
        padding: 9px 15px;
        border-radius: 10px;
        font-size: 11px;
        box-shadow: none;
      }
      .yj-adaptation-modes { margin: 15px 0 20px; }
      .yj-adapt-mode {
        min-height: 55px;
        border-color: rgba(33,132,108,.12);
        background: #f6fbf9;
      }
      .yj-portal-utility { gap: 10px; }
      .yj-portal-utility button {
        min-height: 64px;
        padding: 14px 17px;
        border-color: rgba(15,23,42,.07);
        border-radius: 14px;
        background: rgba(255,255,255,.76);
        transition: transform .2s ease,border-color .2s ease,background .2s ease;
      }
      .yj-portal-utility button:hover {
        transform: translateY(-2px);
        border-color: rgba(101,87,217,.16);
        background: #fff;
      }
      /* 首页只保留内容与证据入口，避免两个角色挂件争夺视觉焦点 */
      body.yj-portal-home .zhiliu-assistant-widget,
      body.yj-portal-home #zhiliuWidget,
      body.yj-portal-home #assistantDock,
      body.yj-portal-home #assistantDockText { display:none !important; }
      body.yj-portal-home .evidence-trigger {
        right: 28px;
        bottom: 24px;
        box-shadow: 0 12px 30px rgba(45,49,88,.12);
      }
      @media(max-width:1500px){
        .yj-project-navbar-nav a{padding-inline:8px;font-size:11px}
        .yj-project-navbar-nav a[data-view="achievements"],.yj-project-navbar-nav a[data-view="settings"]{display:none}
      }
      @media(max-width:1180px){
        .yj-project-navbar-nav a[data-view="quickdemo"],.yj-project-navbar-nav a[data-view="knowledge"]{display:none}
        .yj-workbench-grid{grid-template-columns:1fr 1fr}
        .yj-workbench-card.global{grid-column:1/-1;min-height:270px}
      }
      @media(max-width:760px){
        .yj-project-navbar{height:58px;padding:0 14px}
        .yj-project-navbar-brand{min-width:auto}
        .yj-project-navbar-nav{display:none}
        .yj-project-account-btn{display:none}
        .yj-project-page{padding-top:58px}
        .yj-project-home.yj-studio-portal{padding:36px 16px 48px}
        .yj-studio-portal-head h1{font-size:34px;letter-spacing:-1.5px}
        .yj-studio-portal-head .yj-subtitle{font-size:15px;line-height:1.6}
        .yj-workbench-grid{grid-template-columns:1fr}
        .yj-workbench-card.global{grid-column:auto}
        .yj-portal-utility{grid-template-columns:1fr}
      }
      @media(prefers-reduced-motion:reduce){
        .yj-workbench-card,.yj-portal-utility button,.yj-home-btn{transition:none!important}
        .yj-workbench-card:hover,.yj-portal-utility button:hover{transform:none!important}
      }

      /* ========== 独立工作台二级入口 ========== */
      .yj-workbench-entry{
        min-height:calc(100vh - 64px);
        padding:clamp(44px,6vh,76px) 24px 72px;
        color:#182132;
        background:#f8fafc;
      }
      .yj-workbench-entry.adaptation-entry{background:radial-gradient(circle at 76% 8%,rgba(42,178,143,.09),transparent 28%),radial-gradient(circle at 10% 24%,rgba(101,87,232,.065),transparent 26%),#f8fafc}
      .yj-workbench-entry.global-entry{background:radial-gradient(circle at 78% 8%,rgba(40,132,219,.09),transparent 28%),radial-gradient(circle at 12% 28%,rgba(43,179,143,.07),transparent 27%),#f8fafc}
      .yj-entry-shell{width:min(1180px,100%);margin:auto}
      .yj-entry-kicker{display:flex;align-items:center;gap:9px;color:#277f6c;font-size:10px;font-weight:850;letter-spacing:1.35px}.global-entry .yj-entry-kicker{color:#2d73b5}.yj-entry-kicker:before{content:'';width:26px;height:1px;background:currentColor;opacity:.55}
      .yj-entry-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);gap:52px;align-items:end;padding-bottom:42px;border-bottom:1px solid rgba(15,23,42,.08)}
      .yj-entry-copy h1{max-width:720px;margin:18px 0 16px;font-size:clamp(38px,4vw,58px);line-height:1.12;letter-spacing:-2.6px}.yj-entry-copy p{max-width:650px;margin:0;color:#68758a;font-size:15px;line-height:1.85}
      .yj-entry-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}.yj-entry-actions button{min-height:44px;padding:0 19px;border:1px solid rgba(15,23,42,.1);border-radius:11px;background:#fff;color:#465267;font-weight:750;cursor:pointer}.yj-entry-actions .primary{border-color:transparent;background:#218c72;color:#fff;box-shadow:0 10px 24px rgba(33,140,114,.19)}.global-entry .yj-entry-actions .primary{background:#287fc5;box-shadow:0 10px 24px rgba(40,127,197,.19)}
      .yj-entry-summary{padding:22px;border:1px solid rgba(15,23,42,.075);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 18px 48px rgba(38,52,78,.07)}.yj-entry-summary>span{color:#96a0b0;font-size:9px;font-weight:800;letter-spacing:1.2px}.yj-entry-summary h3{margin:12px 0 15px;font-size:17px}.yj-entry-summary dl{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0}.yj-entry-summary dt{color:#9aa4b4;font-size:9px}.yj-entry-summary dd{margin:4px 0 0;color:#354155;font-size:12px;font-weight:750}
      .yj-entry-section{padding-top:34px}.yj-entry-section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:17px}.yj-entry-section-head h2{margin:0;font-size:20px;letter-spacing:-.4px}.yj-entry-section-head p{margin:0;color:#929daf;font-size:11px}
      .yj-entry-path{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.yj-entry-step{position:relative;min-height:132px;padding:20px;border:1px solid rgba(15,23,42,.07);border-radius:16px;background:rgba(255,255,255,.74)}.yj-entry-step em{display:block;color:#a0a9b8;font:800 9px/1 sans-serif;letter-spacing:1px}.yj-entry-step h3{margin:15px 0 7px;font-size:14px}.yj-entry-step p{margin:0;color:#7b879a;font-size:10px;line-height:1.65}.yj-entry-step:not(:last-child):after{content:'→';position:absolute;right:-10px;top:50%;z-index:2;color:#b7bfcb;font-size:12px}
      .yj-entry-options{display:grid;grid-template-columns:1fr 1fr;gap:12px}.yj-entry-option{display:flex;align-items:center;gap:15px;padding:18px;border:1px solid rgba(15,23,42,.075);border-radius:16px;background:rgba(255,255,255,.78);cursor:pointer;text-align:left;transition:.2s ease}.yj-entry-option:hover{transform:translateY(-2px);border-color:rgba(33,140,114,.24);background:#fff}.yj-entry-option i{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#edf8f4;font-style:normal;font-size:20px}.global-entry .yj-entry-option i{background:#edf6fc}.yj-entry-option b,.yj-entry-option small{display:block}.yj-entry-option b{font-size:13px;color:#2c374a}.yj-entry-option small{margin-top:4px;color:#8995a7;font-size:10px}
      @media(max-width:850px){.yj-entry-hero{grid-template-columns:1fr;gap:28px}.yj-entry-path{grid-template-columns:1fr 1fr}.yj-entry-step:nth-child(2):after{display:none}}
      @media(max-width:560px){.yj-workbench-entry{padding:34px 15px 55px}.yj-entry-copy h1{font-size:34px;letter-spacing:-1.5px}.yj-entry-path,.yj-entry-options{grid-template-columns:1fr}.yj-entry-step:after{display:none}.yj-entry-summary dl{grid-template-columns:1fr}}

      /* ========== 响应式 ========== */
      @media (max-width: 640px) {
        .yj-project-navbar { padding: 0 14px; height: 50px; }
        .error-toast { top: 68px !important; }
        .yj-project-navbar-brand { font-size: 14px; }
        .yj-project-navbar-nav a { padding: 6px 10px; font-size: 12px; }
        .yj-project-home h1 { font-size: 28px; }
        .yj-project-home .yj-subtitle { font-size: 15px; }
        .yj-project-home-actions { flex-direction: column; align-items: center; }
        .yj-project-home-features { grid-template-columns: repeat(3, 1fr); }
        .yj-project-card-top { flex-direction: column; gap: 8px; }
        .yj-project-card-name { max-width: 100%; }
        .yj-knowledge-wrap { width: min(100% - 24px, 1180px); padding-top: 18px; }
        .yj-knowledge-hero { align-items: flex-start; flex-direction: column; }
        .yj-knowledge-grid { grid-template-columns: 1fr; }
      }
      @media (min-width: 641px) and (max-width: 980px) { .yj-knowledge-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media(max-width:1450px){.yj-project-navbar{padding-left:16px;padding-right:16px}.yj-project-navbar-nav a{padding-left:9px;padding-right:9px;font-size:11.5px}.yj-project-navbar-right{gap:6px}.yj-project-new-btn,.yj-project-account-btn{padding-left:11px;padding-right:11px;font-size:11px}}
      @media(max-width:1100px){.yj-project-navbar-nav a[data-view="settings"],.yj-project-navbar-nav a[data-view="achievements"]{display:none}.yj-workbench-grid{grid-template-columns:1fr}.yj-demo-grid{grid-template-columns:1fr 1fr}.yj-project-type-picker{grid-template-columns:1fr}.yj-portal-utility{grid-template-columns:1fr}}
      @media(max-width:640px){.yj-demo-grid,.yj-adaptation-modes{grid-template-columns:1fr}.yj-studio-portal-head h1{font-size:30px}.yj-project-home.yj-studio-portal{padding:28px 14px 70px}}
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
          <li><a data-view="workspace">✨ 原创工作台</a></li>
          <li><a data-view="adaptation">🎞 IP改编工作台</a></li>
          <li><a data-view="global">🌏 文化出海工作台</a></li>
          <li><a data-view="projects">📂 我的项目</a></li>
          <li><a data-view="knowledge">🧠 专家智库 · 资料库</a></li>
          <li><a data-view="achievements">🏆 成果中心</a></li>
          <li><a data-view="quickdemo">⚡ 四类 Demo</a></li>
          <li><a data-view="settings">&#9881; 设置</a></li>
        </ul>
        <div class="yj-project-navbar-right">
          <button class="yj-project-account-btn" id="yj-nav-account-btn" title="返回登录页并切换创作者">👤 切换创作者</button>
          <button class="yj-project-new-btn" id="yj-nav-new-btn">+ 新建项目</button>
        </div>
      </nav>

      <div class="yj-project-page yj-page-active" id="yj-page-home">
        <div class="yj-project-home yj-studio-portal">
          <header class="yj-studio-portal-head">
            <div class="yj-project-home-badge">YUNJIANG MULTI-AGENT PRODUCTION SYSTEM</div>
            <h1>从一个想法，或一部作品开始</h1>
            <p class="yj-subtitle">原创短剧生产与 IP 影视化改编，一套专家系统完成</p>
            <p>17位专家 · 版本化 Skills · 专属资料库 · 人在回路 · 全程证据</p>
          </header>
          <section class="yj-workbench-grid" aria-label="三大核心工作台">
            <article class="yj-workbench-card original" data-workbench="original">
              <div class="yj-workbench-eyebrow"><span>ORIGINAL DRAMA STUDIO</span><span class="yj-workbench-number">01</span></div>
              <h2>✨ 原创短剧工作台</h2>
              <p>输入一个故事想法，由17位专家协作完成故事方向、人物小传、剧情大纲、集纲、正文剧本与质量终审。</p>
              <div class="yj-workbench-flow"><span>创意</span><i>→</i><span>故事大纲</span><i>→</i><span>人物</span><i>→</i><span>集纲</span><i>→</i><span>正文</span></div>
              <div class="yj-workbench-actions"><button class="yj-home-btn yj-home-btn-primary" id="yj-home-start">新建原创项目</button><button class="yj-home-btn yj-home-btn-ghost" data-portal-demo="original">60秒 Demo</button></div>
            </article>
            <article class="yj-workbench-card adaptation" data-workbench="adaptation">
              <div class="yj-workbench-eyebrow"><span>IP ADAPTATION LAB</span><span class="yj-workbench-number">02</span></div>
              <h2>🎞 IP影视化改编工作台</h2>
              <p>拆解已有作品，锁定故事骨架，诊断不可影视化内容，并生成可回溯、可审核的真人短剧方案。</p>
              <div class="yj-adaptation-modes"><div class="yj-adapt-mode"><i>📖</i><div><b>文学作品拆解</b><small>TXT · EPUB · 文本 PDF</small></div></div><div class="yj-adapt-mode"><i>▦</i><div><b>漫画作品拆解</b><small>画格 · 对白 · 镜头映射</small></div></div></div>
              <div class="yj-workbench-actions"><button class="yj-home-btn yj-home-btn-adapt" data-portal-adaptation="literary">文学拆解</button><button class="yj-home-btn yj-home-btn-adapt" data-portal-adaptation="manga">漫画拆解</button></div>
            </article>
            <article class="yj-workbench-card global" data-workbench="global">
              <div class="yj-workbench-eyebrow"><span>CULTURAL IP GLOBALIZATION</span><span class="yj-workbench-number">03</span></div>
              <h2>🌏 文化出海工作台</h2>
              <p>锁定中国文化内核，完成海外受众分析、跨文化风险诊断、本地化改编、双语剧本与发行交付。</p>
              <div class="yj-workbench-flow"><span>文化资产</span><i>→</i><span>风险雷达</span><i>→</i><span>本地化</span><i>→</i><span>双语</span><i>→</i><span>发行包</span></div>
              <div class="yj-workbench-actions"><button class="yj-home-btn yj-home-btn-global" data-portal-global>进入出海工作台</button><button class="yj-home-btn yj-home-btn-ghost" data-portal-demo="global">比赛 Demo</button></div>
            </article>
          </section>
          <section class="yj-portal-utility">
            <button id="yj-home-projects"><i>📂</i><span><b>我的项目</b><small>继续上次任务与人工检查点</small></span></button>
            <button id="yj-home-demo"><i>⚡</i><span><b>四类快速 Demo</b><small>原创、文学、漫画与文化出海</small></span></button>
            <button data-portal-view="knowledge"><i>🧠</i><span><b>专家与资料库</b><small>查看 Agent、Skill 与知识绑定</small></span></button>
          </section>
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

      <div class="yj-project-page" id="yj-page-adaptation-portal">
        <main class="yj-workbench-entry adaptation-entry">
          <div class="yj-entry-shell">
            <section class="yj-entry-hero">
              <div class="yj-entry-copy">
                <div class="yj-entry-kicker">IP ADAPTATION LAB</div>
                <h1>忠于原作骨架，重构为可拍的故事。</h1>
                <p>从文学文本或漫画页面出发，提取可溯源事实、锁定不可改动的叙事内核，再完成影视化诊断、人工决策与分场交付。</p>
                <div class="yj-entry-actions"><button class="primary" data-adaptation-enter="literary">开始文学作品拆解</button><button data-adaptation-enter="manga">开始漫画作品拆解</button></div>
              </div>
              <aside class="yj-entry-summary"><span>PRODUCTION STANDARD</span><h3>改编不是重写，而是有依据的转译</h3><dl><div><dt>输入类型</dt><dd>TXT · EPUB · PDF · 漫画</dd></div><div><dt>人工检查点</dt><dd>骨架锁定 · 方案确认</dd></div><div><dt>核心证据</dt><dd>章节 / 页格级溯源</dd></div><div><dt>最终交付</dt><dd>可拍分场与变更台账</dd></div></dl></aside>
            </section>
            <section class="yj-entry-section"><div class="yj-entry-section-head"><h2>从原作到镜头的四个关键阶段</h2><p>每一步都有 Agent、Skill 与人工决定记录</p></div><div class="yj-entry-path"><article class="yj-entry-step"><em>01 / EXTRACT</em><h3>事实提取</h3><p>识别人物、事件、对白与出处，不让模型自由脑补。</p></article><article class="yj-entry-step"><em>02 / LOCK</em><h3>骨架锁定</h3><p>确认主题、关键因果和人物主动选择等不可变量。</p></article><article class="yj-entry-step"><em>03 / ADAPT</em><h3>影视化改编</h3><p>解决不可视化、高成本、节奏与现代价值问题。</p></article><article class="yj-entry-step"><em>04 / DELIVER</em><h3>分场交付</h3><p>输出改编前后对照、分场说明书和完整证据链。</p></article></div></section>
            <section class="yj-entry-section"><div class="yj-entry-section-head"><h2>选择你的原作类型</h2><p>进入后仍可切换模式</p></div><div class="yj-entry-options"><button class="yj-entry-option" data-adaptation-enter="literary"><i>📖</i><span><b>文学作品改编</b><small>适合小说、故事、纪实文本与文本 PDF</small></span></button><button class="yj-entry-option" data-adaptation-enter="manga"><i>▦</i><span><b>漫画作品改编</b><small>识别页序、画格、对白、人物与镜头关系</small></span></button></div></section>
          </div>
        </main>
      </div>
      <div class="yj-project-page" id="yj-page-global-portal">
        <main class="yj-workbench-entry global-entry">
          <div class="yj-entry-shell">
            <section class="yj-entry-hero">
              <div class="yj-entry-copy">
                <div class="yj-entry-kicker">CULTURAL IP GLOBALIZATION</div>
                <h1>让中国故事被理解，而不是被稀释。</h1>
                <p>先锁定不可替换的文化资产，再根据目标市场完成风险诊断、本地化表达、双语剧本和发行交付，让每次改编都可解释、可审核。</p>
                <div class="yj-entry-actions"><button class="primary" data-global-enter>创建文化出海项目</button><button data-portal-demo="global">运行比赛 Demo</button></div>
              </div>
              <aside class="yj-entry-summary"><span>GLOBAL DELIVERY</span><h3>文化保真与市场理解同时成立</h3><dl><div><dt>目标市场</dt><dd>东南亚 · 北美 · 欧洲等</dd></div><div><dt>核心门禁</dt><dd>文化资产 · 本地化方向</dd></div><div><dt>语言交付</dt><dd>中文 + 目标市场语言</dd></div><div><dt>最终交付</dt><dd>剧本 · 字幕 · 发行包</dd></div></dl></aside>
            </section>
            <section class="yj-entry-section"><div class="yj-entry-section-head"><h2>一条完整的文化出海生产链</h2><p>保留文化身份，降低理解门槛</p></div><div class="yj-entry-path"><article class="yj-entry-step"><em>01 / ASSET</em><h3>文化资产锁定</h3><p>确认技艺、意象、价值观和叙事内核中的不可替换项。</p></article><article class="yj-entry-step"><em>02 / RISK</em><h3>跨文化风险</h3><p>识别理解障碍、价值偏差、刻板印象与平台合规风险。</p></article><article class="yj-entry-step"><em>03 / LOCALIZE</em><h3>本地化转译</h3><p>保持故事骨架，通过行动、语境和节奏完成表达适配。</p></article><article class="yj-entry-step"><em>04 / RELEASE</em><h3>发行交付</h3><p>生成双语剧本、字幕、风险台账与平台发行物料。</p></article></div></section>
            <section class="yj-entry-section"><div class="yj-entry-options"><button class="yj-entry-option" data-global-enter><i>🌏</i><span><b>进入文化出海制片工作台</b><small>配置文化项目、目标市场、语言和发行平台</small></span></button><button class="yj-entry-option" data-portal-view="knowledge"><i>🧠</i><span><b>查看专家与文化资料库</b><small>了解 Agent、Skill 与专属知识绑定</small></span></button></div></section>
          </div>
        </main>
      </div>

      <div class="yj-project-page" id="yj-page-adaptation" aria-label="文学与漫画IP改编执行工作台"></div>
      <div class="yj-project-page" id="yj-page-global" aria-label="文化IP出海制片执行工作台"></div>

      <div class="yj-project-page" id="yj-page-knowledge">
        <div class="yj-knowledge-wrap">
          <section class="yj-knowledge-hero">
            <div>
              <span class="yj-knowledge-eyebrow">AGENT × SKILL × KNOWLEDGE</span>
              <h2>17 位专家 · 专属文化资料库</h2>
              <p>每位专家都绑定版本化 Skill 与独立知识资料。这里仅用于展示系统能力与调度状态，资料内容不可打开或修改。</p>
            </div>
            <div class="yj-knowledge-stats">
              <span><b>17</b>专家 Agents</span>
              <span><b>17</b>版本化 Skills</span>
              <span><b>17</b>专属资料库</span>
            </div>
          </section>
          <div class="yj-knowledge-legend">
            <span><i></i>等待调度</span><span class="running"><i></i>正在检索与执行</span><span class="done"><i></i>本次运行已调用</span>
            <span style="margin-left:auto;">🔒 只读能力展示</span>
          </div>
          <div class="yj-knowledge-grid" id="yj-knowledge-grid"></div>
        </div>
      </div>

      <div class="yj-project-page" id="yj-page-achievements">
        <div class="yj-achievements-wrap">
          <div class="yj-achievements-header">
            <h2 id="yj-ach-title">🏆 成果中心</h2>
            <button class="yj-home-btn yj-home-btn-ghost" id="yj-ach-back">← 返回项目</button>
          </div>
          <div class="yj-ach-type-summary"><span><b>✨ 原创剧本</b><small>故事大纲 · 人物小传 · 集纲 · 正文</small></span><span><b>📖 文学改编</b><small>骨架锁定 · 改编对照 · 分场说明书</small></span><span><b>▦ 漫画改编</b><small>画格事实 · 对白校正 · 镜头映射</small></span><span><b>🌏 文化出海</b><small>文化资产 · 双语剧本 · 发行交付包</small></span></div>
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
        <div class="yj-demo-hub">
          <header class="yj-demo-hero"><h2>⚡ 四条核心生产链，零 Token 快速体验</h2><p>每个 Demo 都进入对应工作台，展示专家调度、人工检查点、中间产出与最终价值。</p></header>
          <input type="hidden" id="yj-demo-idea" value="非遗短剧《最后一炉》：景泰蓝传人林砚为保住祖父留下的老作坊，与投资人顾沉舟达成30天对赌。" />
          <div class="yj-demo-grid">
            <article class="yj-demo-card"><span class="icon">✨</span><h3>原创短剧 Demo</h3><p>《最后一炉》从一句创意运行到故事大纲、人物小传、集纲与正文。</p><ul><li>✓ 4项核心产出</li><li>✓ 专家执行过程</li><li>✓ Agent Run 证据</li></ul><button class="yj-home-btn yj-home-btn-primary" id="yj-demo-run" data-demo-type="original">运行原创 Demo</button></article>
            <article class="yj-demo-card"><span class="icon">📖</span><h3>文学改编 Demo</h3><p>《灯影里的旧账》锁定原著骨架，诊断不可影视化内容并形成分场。</p><ul><li>✓ 原文分块与引用</li><li>✓ 2个人工检查点</li><li>✓ 改编前后对照</li></ul><button class="yj-home-btn yj-home-btn-adapt" data-demo-type="literary">运行文学改编 Demo</button></article>
            <article class="yj-demo-card"><span class="icon">▦</span><h3>漫画拆解 Demo</h3><p>《末班渡口》识别画格、对白和说话人，并映射为真人短剧镜头。</p><ul><li>✓ 3页8个画格</li><li>✓ 对白人工校正</li><li>✓ 画格到镜头映射</li></ul><button class="yj-home-btn yj-home-btn-adapt" data-demo-type="manga">运行漫画拆解 Demo</button></article>
            <article class="yj-demo-card"><span class="icon">🌏</span><h3>文化出海 Demo</h3><p>《最后一炉》锁定非遗内核，生成海外本地化方案、双语剧本和发行交付包。</p><ul><li>✓ 文化资产锁定</li><li>✓ 跨文化风险雷达</li><li>✓ 双语发行交付</li></ul><button class="yj-home-btn yj-home-btn-global" data-demo-type="global">运行文化出海 Demo</button></article>
          </div>
          <div id="yj-demo-result" style="margin-top:16px;display:none;"><div style="padding:14px;border-radius:10px;background:rgba(241,245,249,0.8);border:1px solid rgba(203,213,225,0.3);color:#475569;font-size:14px;white-space:pre-wrap;line-height:1.6;" id="yj-demo-output"></div></div>
        </div>
      </div>

      <div class="yj-project-modal-overlay" id="yj-new-project-modal">
        <div class="yj-project-modal">
          <div class="yj-project-mode-badge" id="yj-new-project-mode">自动驾驶</div>
          <h3 id="yj-new-project-title">✨ 快速新建项目</h3>
          <p class="yj-project-modal-subtitle" id="yj-new-project-subtitle">只需输入故事想法，其余由云匠自动配置。</p>
          <label class="yj-project-form-label">选择生产模式</label>
          <div class="yj-project-type-picker" id="yj-project-type-picker">
            <label class="yj-project-type-option"><input type="radio" name="yj-project-type" value="original" checked><span><b>✨ 原创短剧</b><small>从一个想法开始完整创作</small></span></label>
            <label class="yj-project-type-option"><input type="radio" name="yj-project-type" value="literary_adaptation"><span><b>📖 文学改编</b><small>小说、文章与文本 PDF</small></span></label>
            <label class="yj-project-type-option"><input type="radio" name="yj-project-type" value="manga_adaptation"><span><b>▦ 漫画改编</b><small>漫画页、画格与对白拆解</small></span></label>
            <label class="yj-project-type-option"><input type="radio" name="yj-project-type" value="globalization"><span><b>🌏 文化出海</b><small>跨文化改编、双语与发行包</small></span></label>
          </div>
          <label class="yj-project-form-label" for="yj-new-project-name">项目名称（可选）</label>
          <input type="text" id="yj-new-project-name" placeholder="项目名称（如：都市逆袭之巅峰人生）" />
          <label class="yj-project-form-label" for="yj-new-project-idea" id="yj-project-input-label">故事想法</label>
          <textarea id="yj-new-project-idea" placeholder="描述你的短剧创意...&#10;例如：一个普通大学生意外获得超能力，在校园中经历爱情、友情与成长的故事，共5集，每集3分钟"></textarea>
          <div class="yj-auto-config-card" id="yj-auto-config-card">
            <b>✨ 云匠自动配置</b>
            自动选择题材与风格包 · 调度 17 位专家及其专属资料库 · 自动完成故事大纲、人物小传、集纲、正文与质量门禁
          </div>
          <div class="yj-pro-project-fields" id="yj-pro-project-fields">
            <div class="yj-pro-project-grid">
              <label><span class="yj-project-form-label">主打场景</span><select id="yj-project-genre"><option value="非遗短剧">非遗短剧</option><option value="男频爽文">男频爽文</option><option value="校园甜宠">校园甜宠</option><option value="都市情感">都市情感</option><option value="悬疑反转">悬疑反转</option></select></label>
              <label><span class="yj-project-form-label">目标集数</span><select id="yj-project-episodes"><option value="5">5 集 · 快速样片</option><option value="12" selected>12 集 · 标准短季</option><option value="24">24 集 · 完整季</option><option value="40">40 集 · 长线连载</option></select></label>
              <label><span class="yj-project-form-label">发布平台</span><select id="yj-project-platform"><option value="自动匹配">自动匹配</option><option value="抖音">抖音</option><option value="红果">红果</option><option value="快手">快手</option><option value="微信短剧">微信短剧</option></select></label>
              <label><span class="yj-project-form-label">目标受众</span><input id="yj-project-audience" type="text" placeholder="如：18-30岁女性" /></label>
              <label><span class="yj-project-form-label">风格经验包</span><select id="yj-project-style"><option value="cinematic">电影质感</option><option value="hook_dense">强钩子爽感</option><option value="emotional">细腻共情</option><option value="heritage">文化叙事</option></select></label>
              <label><span class="yj-project-form-label">人在回路</span><select id="yj-project-checkpoint"><option value="human" selected>开启 · 3 个评审检查点</option><option value="auto">关闭 · 自动通过</option></select></label>
            </div>
            <label class="yj-project-form-label" for="yj-project-constraints">制作约束（可选）</label>
            <textarea id="yj-project-constraints" placeholder="场景数量、演员规模、预算、禁用表达等"></textarea>
          </div>
          <div class="yj-project-modal-actions">
            <button class="yj-home-btn yj-home-btn-ghost" id="yj-modal-cancel">取消</button>
            <button class="yj-home-btn yj-home-btn-primary" id="yj-modal-create">开始创作</button>
          </div>
        </div>
      </div>

      <div class="yj-project-toast" id="yj-toast"></div>
    `;
    document.body.appendChild(container);
    renderKnowledgeHub();
  }

  function renderKnowledgeHub() {
    var grid = document.getElementById('yj-knowledge-grid');
    if (!grid) return;
    grid.innerHTML = EXPERT_KNOWLEDGE_BINDINGS.map(function(item, index) {
      return '<article class="yj-knowledge-card" data-knowledge-expert="' + item.id + '" aria-disabled="true" title="只读能力展示，资料内容不可打开">' +
        '<div class="yj-knowledge-card-head">' +
          '<span class="yj-knowledge-avatar">' + item.icon + '</span>' +
          '<div><b>' + escapeHtml(item.name) + '</b><small>' + escapeHtml(item.role) + '</small></div>' +
          '<em class="yj-knowledge-state"><i></i><span>等待</span></em>' +
        '</div>' +
        '<div class="yj-knowledge-bind">' +
          '<div><small>VERSIONED SKILL</small><b>' + escapeHtml(item.skill) + ' · v1.' + (index % 3) + '</b></div>' +
          '<span>⇄</span>' +
          '<div><small>PRIVATE KNOWLEDGE</small><b>' + escapeHtml(item.library) + '</b></div>' +
        '</div>' +
        '<div class="yj-knowledge-readonly"><span>🔒 资料库只读 · 不提供打开入口</span><span>已绑定</span></div>' +
      '</article>';
    }).join('');
  }

  function refreshKnowledgeHub() {
    var activeSource = document.querySelector('[data-expert].working, [data-expert].active');
    var activeId = activeSource ? activeSource.getAttribute('data-expert') : '';
    document.querySelectorAll('[data-knowledge-expert]').forEach(function(card) {
      var id = card.getAttribute('data-knowledge-expert');
      var source = document.querySelector('[data-expert="' + id + '"]');
      var working = id === activeId;
      var done = !!(source && (source.classList.contains('done') || source.classList.contains('completed')));
      card.classList.toggle('working', working);
      card.classList.toggle('done', !working && done);
      var state = card.querySelector('.yj-knowledge-state span');
      if (state) state.textContent = working ? '检索中' : done ? '已调用' : '等待';
    });
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
    document.body.classList.toggle('yj-portal-home', view === 'home');
    document.querySelectorAll('.yj-project-page').forEach(function(p) { p.classList.remove('yj-page-active'); });
    document.querySelectorAll('.yj-project-navbar-nav a').forEach(function(a) {
      a.classList.remove('yj-nav-active');
      var navView = view === 'adaptation-studio' ? 'adaptation' : view === 'global-studio' ? 'global' : view;
      if (a.dataset.view === navView) a.classList.add('yj-nav-active');
    });

    var appContainer = document.querySelector('.app-container');
    var onboardingScreen = document.querySelector('.onboarding-screen');
    var projectRoot = document.getElementById('yj-project-root');
    var isProjectView = ['home','projects','adaptation','adaptation-studio','global','global-studio','knowledge','achievements','settings','newproject','quickdemo'].indexOf(view) >= 0;

    // Toggle original app-container and onboarding-screen visibility
    if (appContainer) {
      appContainer.style.setProperty('display', isProjectView ? 'none' : 'grid', 'important');
      appContainer.style.setProperty('visibility', isProjectView ? 'hidden' : 'visible', 'important');
    }
    if (onboardingScreen) { onboardingScreen.style.setProperty('display', 'none', 'important'); }
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
      case 'adaptation':
        document.getElementById('yj-page-adaptation-portal').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        break;
      case 'adaptation-studio':
        document.getElementById('yj-page-adaptation').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        if (window.YJAdaptationWorkbench) window.YJAdaptationWorkbench.open();
        break;
      case 'global':
        document.getElementById('yj-page-global-portal').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        break;
      case 'global-studio':
        document.getElementById('yj-page-global').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        if (window.YJGlobalWorkbench) window.YJGlobalWorkbench.open();
        break;
      case 'knowledge':
        document.getElementById('yj-page-knowledge').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        refreshKnowledgeHub();
        break;
      case 'achievements':
        document.getElementById('yj-page-achievements').classList.add('yj-page-active');
        var ac = document.querySelector('.app-container'); if (ac) ac.style.setProperty('display', 'none', 'important');
        break;
      case 'workspace':
        var ac = document.querySelector('.app-container');
        if (ac) {
          ac.style.setProperty('display', 'grid', 'important');
          ac.style.setProperty('visibility', 'visible', 'important');
        }
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

  window.YJOpenWorkspace = function() {
    switchView('workspace');
    var welcome = document.getElementById('welcomeScreen');
    if (welcome) welcome.style.display = 'none';
  };

  window.YJBackToPortal = function() {
    switchView('home');
    showToast('已返回访问首页，当前创作进度已保留');
  };

  function ensureWorkspaceBackButton() {
    if (document.getElementById('yj-workspace-back-btn')) return;
    var actions = document.querySelector('.app-container .top-actions');
    if (!actions) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'yj-workspace-back-btn';
    button.className = 'yj-workspace-back-btn';
    button.title = '返回访问首页，保留当前创作进度';
    button.innerHTML = '<span aria-hidden="true">←</span><span>返回访问页</span>';
    button.addEventListener('click', window.YJBackToPortal);
    actions.insertBefore(button, actions.firstChild);
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
      if (emptyBtn) emptyBtn.addEventListener('click', function(){openNewProjectModal('original');});
      return;
    }

    projectList = Array.isArray(data) ? data : (data.projects || []);
    renderProjectList(projectList);
  }

  function renderProjectList(projects) {
    var listEl = document.getElementById('yj-project-list');
    if (!listEl) return;

    listEl.innerHTML = projects.map(function(p) {
      var projectType = p.project_type || 'original';
      var typeMeta = projectType === 'globalization' ? {label:'🌏 文化出海',cls:'global',total:7,action:'继续出海'} : projectType === 'manga_adaptation' ? {label:'▦ 漫画改编',cls:'manga',total:8,action:'继续拆解'} : projectType === 'literary_adaptation' ? {label:'📖 文学改编',cls:'literary',total:7,action:'继续改编'} : {label:'✨ 原创短剧',cls:'original',total:17,action:'继续创作'};
      var si = getStatusInfo(p.status);
      var stageCount = getStageCount(p.status, p.current_stage);
      var progressPct = Math.round((Math.min(stageCount,typeMeta.total) / typeMeta.total) * 100);
      var stageStep = stageToStep(p.current_stage);
      var stageName = (stageStep > 0 && stageStep <= 17)
        ? STAGE_NAMES[stageStep - 1]
        : (p.current_stage || '未开始');
      var updatedAt = formatDate(p.updated_at || p.created_at);

      return '<div class="yj-project-card" data-project-id="' + p.project_id + '">' +
        '<div class="yj-project-card-top">' +
          '<div class="yj-project-card-titleline"><span class="yj-project-type-pill '+typeMeta.cls+'">'+typeMeta.label+'</span><h3 class="yj-project-card-name">' + escapeHtml(p.title || '未命名项目') + '</h3></div>' +
          '<span class="yj-project-status-tag" style="color:' + si.color + ';background:' + si.bg + '">' + si.label + '</span>' +
        '</div>' +
        '<div class="yj-project-card-meta">' +
          '<span>📍 当前阶段：' + escapeHtml(stageName) + '</span>' +
          '<span>📊 完成度：' + Math.min(stageCount,typeMeta.total) + '/' + typeMeta.total + '</span>' +
          '<span>🕐 ' + updatedAt + '</span>' +
        '</div>' +
        '<div class="yj-project-progress-bar">' +
          '<div class="yj-project-progress-fill" style="width:' + progressPct + '%"></div>' +
        '</div>' +
        '<div class="yj-project-card-actions">' +
          '<button class="yj-project-action-btn yj-btn-primary" data-action="continue" data-id="' + p.project_id + '" data-project-type="'+projectType+'">▶ '+typeMeta.action+'</button>' +
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
      if (action === 'continue') yjContinueProject(id, btn.dataset.projectType);
      else if (action === 'view') yjViewAchievements(id);
      else if (action === 'delete') yjDeleteProject(id);
    };
  }

  // ========== 新建项目 ==========
  function getCurrentDisplayMode() {
    return (document.body && document.body.getAttribute('data-yj-mode')) ||
      (function(){ try { return localStorage.getItem('yj_display_mode'); } catch(e) { return ''; } })() || 'normal';
  }

  function syncProjectModalMode() {
    var professional = getCurrentDisplayMode() === 'pro';
    var badge = document.getElementById('yj-new-project-mode');
    var title = document.getElementById('yj-new-project-title');
    var subtitle = document.getElementById('yj-new-project-subtitle');
    var create = document.getElementById('yj-modal-create');
    if (badge) badge.textContent = professional ? '专业驾驶舱' : '自动驾驶';
    var projectType = getSelectedProjectType();
    var typeLabel = projectType === 'globalization' ? '文化出海' : projectType === 'manga_adaptation' ? '漫画改编' : projectType === 'literary_adaptation' ? '文学改编' : '原创短剧';
    if (title) title.textContent = (professional ? '🧭 专业项目配置 · ' : '✨ 快速新建 · ') + typeLabel;
    if (subtitle) subtitle.textContent = projectType === 'globalization' ? '选择已有文化内容或输入案例说明，进入海外受众、风险、本地化与发行交付流程。' : projectType !== 'original' ? '创建改编项目后进入 IP 工作台，建立可回溯的作品事实层。' : professional
      ? '配置平台、受众、风格经验包和人在回路策略，随后进入完整 Agent 调度。'
      : '只需输入故事想法，其余由云匠自动配置。';
    if (create) create.textContent = projectType === 'original' ? (professional ? '按配置启动' : '开始自动创作') : projectType === 'globalization' ? '创建并进入出海工作台' : '创建并进入改编工作台';
    var label=document.getElementById('yj-project-input-label'), idea=document.getElementById('yj-new-project-idea'), pro=document.getElementById('yj-pro-project-fields'), auto=document.getElementById('yj-auto-config-card');
    if(label)label.textContent=projectType==='original'?'故事想法':projectType==='globalization'?'待出海作品 / 文化IP说明':'作品说明 / 授权备注';
    if(idea)idea.placeholder=projectType==='original'?'描述你的短剧创意...\n例如：一个普通大学生意外获得超能力，在校园中经历爱情、友情与成长的故事。':projectType==='globalization'?'填写待出海作品、文化资产和目标市场；也可直接运行《最后一炉》比赛 Demo。':'填写作品名称、内容简介和当前授权状态；进入工作台后再导入原始文件。';
    if(projectType!=='original'){if(pro)pro.style.display='none';if(auto)auto.style.display='none';}else{if(pro)pro.style.display='';if(auto)auto.style.display='';}
  }

  function getSelectedProjectType(){var selected=document.querySelector('input[name="yj-project-type"]:checked');return selected?selected.value:'original';}

  function openNewProjectModal(preselectedType) {
    var modal = document.getElementById('yj-new-project-modal');
    if (modal) {
      modal.classList.add('yj-modal-show');
      document.getElementById('yj-new-project-name').value = '';
      document.getElementById('yj-new-project-idea').value = '';
      if(preselectedType){var selected=document.querySelector('input[name="yj-project-type"][value="'+preselectedType+'"]');if(selected)selected.checked=true;}
      syncProjectModalMode();
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

    var projectType=getSelectedProjectType();
    if (!idea) {
      showToast(projectType==='original'?'请输入你的短剧创意':'请填写作品说明或授权备注');
      return;
    }

    var mode = getCurrentDisplayMode();
    var professional = mode === 'pro';
    var config = professional ? {
      genre: document.getElementById('yj-project-genre').value,
      total_episodes: Number(document.getElementById('yj-project-episodes').value) || 12,
      platform: document.getElementById('yj-project-platform').value,
      audience: document.getElementById('yj-project-audience').value.trim(),
      style_pack_id: document.getElementById('yj-project-style').value,
      checkpoint_policy: document.getElementById('yj-project-checkpoint').value,
      constraints: document.getElementById('yj-project-constraints').value.trim()
    } : {
      genre: '', total_episodes: 5, platform: '自动匹配', audience: '',
      style_pack_id: 'cinematic', checkpoint_policy: 'auto', constraints: ''
    };
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
        genre: config.genre,
        project_type: projectType
      });

      if (!projectData || !projectData.project_id) {
        showToast('创建项目失败，请稍后重试');
        return;
      }

      var projectId = projectData.project_id;
      showToast('项目创建成功！');
      closeNewProjectModal();

      currentProject = { project_id: projectId, title: projectName, workflow_id: null, original_idea: idea, project_type: projectType, creation_mode: mode, config: config };
      try { localStorage.setItem('yj_current_project', JSON.stringify(currentProject)); } catch(e) {}
      if(projectType==='globalization'){
        switchView('global-studio');
        if(window.YJGlobalWorkbench)window.YJGlobalWorkbench.reset();
        showToast('文化出海项目已创建');
        return;
      }
      if(projectType!=='original'){
        switchView('adaptation-studio');
        if(window.YJAdaptationWorkbench){window.YJAdaptationWorkbench.reset();window.YJAdaptationWorkbench.setMode(projectType==='manga_adaptation'?'manga':'literary');}
        showToast(projectType==='manga_adaptation'?'漫画改编项目已创建':'文学改编项目已创建');
        return;
      }

      // Step 2: 切换到工作台（不在此创建workflow，由startCreation统一创建）
      var ideaInput = document.getElementById('ideaInput');
      if (ideaInput) ideaInput.value = idea;
      switchView('workspace');

      // 存储当前项目关联（workflow_id稍后由startCreation填入）
      currentProject = { project_id: projectId, title: projectName, workflow_id: null, original_idea: idea, project_type: projectType, creation_mode: mode, config: config };
      try { localStorage.setItem('yj_current_project', JSON.stringify(currentProject)); } catch(e) {}
      try { localStorage.setItem('yunjiang_style_pack_v1', config.style_pack_id); } catch(e) {}

      // 触发创作流程，传入项目上下文
      if (typeof window.startCreation === 'function') {
        window.startCreation({ project_id: projectId, idea: idea, mode: mode, config: config });
      } else {
        var generateBtn = document.getElementById('generateBtn');
        if (generateBtn) generateBtn.click();
      }

    } catch(e) {
      console.error('[YJ] 创建项目失败', e);
      showToast('创建失败：' + (e.message || '未知错误'));
    } finally {
      btn.disabled = false;
      syncProjectModalMode();
    }
  }

  // ========== 继续创作 ==========
  window.yjContinueProject = async function(projectId, hintedType) {
    showToast('正在恢复项目...');

    var data = await apiGet('/api/v1/projects/' + projectId);
    if (!data) {
      showToast('获取项目数据失败');
      return;
    }

    var project = data.project || data;
    currentProject = project;
    var projectType=project.project_type||hintedType||'original';
    if(projectType==='globalization'){
      switchView('global-studio');
      if(window.YJGlobalWorkbench)window.YJGlobalWorkbench.open();
      showToast('已恢复文化出海项目：'+(project.title||''));
      return;
    }
    if(projectType!=='original'){
      switchView('adaptation-studio');
      if(window.YJAdaptationWorkbench)window.YJAdaptationWorkbench.setMode(projectType==='manga_adaptation'?'manga':'literary');
      showToast('已恢复'+(projectType==='manga_adaptation'?'漫画拆解':'文学改编')+'项目：'+(project.title||''));
      return;
    }

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
    window.addEventListener('yj-mode-change', syncProjectModalMode);
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
    if (navNewBtn) navNewBtn.addEventListener('click', function(){openNewProjectModal('original');});

    // 返回原登录页；仅退出界面状态，不删除项目和创作进度
    var accountBtn = document.getElementById('yj-nav-account-btn');
    if (accountBtn) accountBtn.addEventListener('click', logoutToLogin);

    // 项目列表新建按钮
    var listNewBtn = document.getElementById('yj-list-new-btn');
    if (listNewBtn) listNewBtn.addEventListener('click', function(){openNewProjectModal('original');});

    // 首页按钮
    var homeStart = document.getElementById('yj-home-start');
    if (homeStart) homeStart.addEventListener('click', function(){openNewProjectModal('original');});

    var homeProjects = document.getElementById('yj-home-projects');
    if (homeProjects) homeProjects.addEventListener('click', function() { switchView('projects'); });

    var homeDemo = document.getElementById('yj-home-demo');
    if (homeDemo) homeDemo.addEventListener('click', function(){switchView('quickdemo');});

    document.querySelectorAll('[data-portal-adaptation]').forEach(function(button){button.addEventListener('click',function(){switchView('adaptation');});});
    document.querySelectorAll('[data-portal-global]').forEach(function(button){button.addEventListener('click',function(){switchView('global');});});
    document.querySelectorAll('[data-adaptation-enter]').forEach(function(button){button.addEventListener('click',function(){openAdaptationMode(this.dataset.adaptationEnter);});});
    document.querySelectorAll('[data-global-enter]').forEach(function(button){button.addEventListener('click',function(){switchView('global-studio');if(window.YJGlobalWorkbench)window.YJGlobalWorkbench.open();});});
    document.querySelectorAll('[data-portal-view]').forEach(function(button){button.addEventListener('click',function(){switchView(this.dataset.portalView);});});
    document.querySelectorAll('[data-portal-demo]').forEach(function(button){button.addEventListener('click',function(){launchCoreDemo(this.dataset.portalDemo);});});
    document.querySelectorAll('input[name="yj-project-type"]').forEach(function(input){input.addEventListener('change',syncProjectModalMode);});

    function openAdaptationMode(mode){
      switchView('adaptation-studio');
      if(window.YJAdaptationWorkbench){window.YJAdaptationWorkbench.reset();window.YJAdaptationWorkbench.setMode(mode==='manga'?'manga':'literary');}
    }

    // 快速体验按钮
    var demoRun = document.getElementById('yj-demo-run');
    if (demoRun) demoRun.addEventListener('click', function(){launchCoreDemo('original');});
    document.querySelectorAll('[data-demo-type="literary"],[data-demo-type="manga"],[data-demo-type="global"]').forEach(function(button){button.addEventListener('click',function(){launchCoreDemo(this.dataset.demoType);});});

    async function launchCoreDemo(type) {
      type=type||'original';
      if(type==='global'){
        switchView('global-studio');
        if(!window.YJGlobalWorkbench){showToast('文化出海演示模块尚未就绪');return;}
        window.YJGlobalWorkbench.reset();
        showToast('正在运行文化出海比赛 Demo');
        await window.YJGlobalWorkbench.runDemoInstant();
        return;
      }
      if(type==='literary'||type==='manga'){
        switchView('adaptation-studio');
        if(!window.YJAdaptationWorkbench){showToast('改编演示模块尚未就绪');return;}
        window.YJAdaptationWorkbench.reset();window.YJAdaptationWorkbench.setMode(type);
        showToast(type==='manga'?'正在运行漫画拆解 Demo':'正在运行文学改编 Demo');
        await window.YJAdaptationWorkbench.runDemoInstant(type);
        return;
      }
      if (window.__yjQuickDemoRunning) {
        showToast('核心演示正在运行，请在工作台查看');
        if (typeof window.YJOpenWorkspace === 'function') window.YJOpenWorkspace();
        return;
      }
      var idea = document.getElementById('yj-demo-idea').value.trim();
      if (!idea) {
        idea = '非遗短剧《最后一炉》：景泰蓝传人林砚为保住祖父留下的老作坊，与投资人顾沉舟达成30天对赌。';
        document.getElementById('yj-demo-idea').value = idea;
      }
      var resultDiv = document.getElementById('yj-demo-result');
      var outputEl = document.getElementById('yj-demo-output');
      resultDiv.style.display = 'block';
      outputEl.textContent = '正在进入创作工作台...';
      try {
        if (typeof window.startQuickDemo !== 'function') throw new Error('演示模块尚未就绪');
        window.__yjQuickDemoPromise = window.startQuickDemo({ idea: idea });
        await window.__yjQuickDemoPromise;
      } catch(err) {
        outputEl.textContent = '演示载入失败：' + err.message;
      }
    }

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
          // 项目上下文交给最终后端桥统一创建，避免一次点击产生两个 workflow。
          if (opts && opts.project_id) {
            showToast('创作引擎启动中...');
          }
          // 执行唯一创作链，并在创建成功后把最终 workflow_id 回写项目。
          var result = await origStartCreation.apply(this, arguments);
          if (opts && opts.project_id && window.YJBackendBridge && window.YJBackendBridge.workflowId) {
            if (currentProject) currentProject.workflow_id = window.YJBackendBridge.workflowId;
            try { localStorage.setItem('yj_current_project', JSON.stringify(currentProject)); } catch(e) {}
          }
          return result;
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
    ensureWorkspaceBackButton();
    bindEvents();
    hookStartCreation();
    hookLoginFlow();
    refreshKnowledgeHub();
    setInterval(refreshKnowledgeHub, 700);

    // 每次重新打开页面都稳定展示访问页，避免旧的 localStorage 登录标记
    // 让登录页短暂闪现后自动跳转。项目、创作进度和创作者资料仍保留。
    showLoginScreen();

    console.log('[云匠引擎] 项目中心模块已加载 ✨');
  }

  // 等待DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
