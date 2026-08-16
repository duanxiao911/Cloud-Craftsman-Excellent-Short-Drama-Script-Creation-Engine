(() => {
  'use strict';

  const sceneMeta = {
    heritage: { icon: '🏛️', name: '非遗短剧', desc: '文化母题、技艺传承与当代情感', color: '#ef8d57' },
    male: { icon: '⚡', name: '男频爽文', desc: '强钩子、快节奏与连续反转', color: '#5c7cfa' },
    campus: { icon: '💗', name: '校园甜宠', desc: '细腻共情、青春关系与轻喜感', color: '#e5659a' }
  };
  const expertOrder = [
    ['mission_commander','实战指挥','拆解目标，确定专家编排'],
    ['project_configurator','项目配置师','锁定集数、受众和交付规格'],
    ['soul_catcher','灵魂捕手','提炼主题与情感母题'],
    ['character_forger','角色铸造师','建立人物弧线与关系网'],
    ['structure_architect','结构建筑师','搭建剧情大纲与节奏曲线'],
    ['dialogue_master','对白大师','校准台词风格与角色声线'],
    ['scene_craftsman','场景工匠','扩写场景动作与视觉细节'],
    ['episode_writer','分集编剧','生成分集剧本与结尾钩子'],
    ['quality_auditor','质量审计','执行结构、节奏与一致性检查'],
    ['revision_editor','改稿编辑','接收反馈并定向返工'],
    ['quality_director','品控总监','监督层终审与放行']
  ];
  const checkpoints = [
    { step: 4, title: '角色设定', desc: '确认人物目标、关系和成长弧线', source: '角色铸造师' },
    { step: 6, title: '剧情大纲', desc: '确认主线结构、冲突与关键反转', source: '结构建筑师' },
    { step: 7, title: '分集剧本', desc: '抽检场次、台词和结尾钩子', source: '分集编剧' }
  ];
  const stylePacks = [
    ['cinematic','🎬','电影质感','镜头化叙事 · 氛围优先'],
    ['hook','⚡','强钩子爽感','高密度冲突 · 连续反转'],
    ['warm','🌙','细腻共情','人物关系 · 情绪留白'],
    ['heritage','🏛️','文化叙事','非遗知识 · 当代转译']
  ];

  const html = `
    <button class="agent-center-trigger" id="agentCenterTrigger" type="button" aria-label="打开Agent能力中心">
      <span class="act-live-dot"></span><span>Agent 能力中心</span><b id="actTriggerCount">17</b>
    </button>
    <div class="agent-live-strip" id="agentLiveStrip">
      <div class="als-orb"><span></span></div>
      <div class="als-copy"><b id="alsTitle">Agent 协作引擎待命</b><small id="alsDetail">决策层、执行层、监督层已就绪</small></div>
      <div class="als-progress"><span id="alsProgressBar"></span></div>
      <span class="als-count" id="alsCount">0 / 17</span>
      <button type="button" onclick="openAgentCenter('execution')">查看执行过程</button>
    </div>
    <div class="agent-center-mask" id="agentCenterMask" onclick="if(event.target===this)closeAgentCenter()">
      <section class="agent-center" role="dialog" aria-modal="true" aria-label="Agent能力中心">
        <header class="agent-center-head">
          <div><span class="ach-eyebrow">YUNJIANG ORCHESTRATOR</span><h2>Agent 能力中心</h2><p>决策、执行、监督与人在回路的统一工作台</p></div>
          <div class="ach-status"><span></span><b id="agentCenterStatus">系统待命</b></div>
          <button class="ach-close" type="button" onclick="closeAgentCenter()">×</button>
        </header>
        <nav class="agent-center-tabs" id="agentCenterTabs">
          <button data-tab="overview" class="active">总览</button>
          <button data-tab="checkpoints">人在回路 <i id="checkpointBadge">3</i></button>
          <button data-tab="execution">执行过程</button>
          <button data-tab="evidence">Run 证据</button>
          <button data-tab="assets">场景与风格</button>
          <button data-tab="delivery">Session & 接口</button>
        </nav>
        <main class="agent-center-body">
          <section class="act-panel active" data-panel="overview">
            <div class="act-hero-card">
              <div><span>THREE-LAYER AGENT SYSTEM</span><h3>从创意到可拍剧本，完整协作链路</h3><p>决策层动态选择专家，执行层生产内容，监督层检查并定向返工。</p></div>
              <div class="act-score"><b id="actQualityScore">88</b><small>质量基线</small></div>
            </div>
            <div class="agent-layer-flow">
              <article><i>01</i><span>🧭</span><b>决策层</b><small>目标拆解 · 专家编排</small></article><em>→</em>
              <article><i>02</i><span>⚙️</span><b>执行层</b><small>17专家 · 结构化产出</small></article><em>→</em>
              <article><i>03</i><span>🛡️</span><b>监督层</b><small>质量门禁 · 定向返工</small></article>
            </div>
            <div class="act-stat-grid">
              <article><span>当前运行</span><b id="actRunState">待命</b><small id="actRunId">尚未创建 Run</small></article>
              <article><span>专家进度</span><b id="actExpertProgress">0 / 17</b><small>实时同步执行状态</small></article>
              <article><span>质量检查</span><b id="actCheckCount">0</b><small>门禁与返工记录</small></article>
              <article><span>中间产物</span><b id="actOutputCount">0</b><small>可检视、可追溯</small></article>
            </div>
            <div class="act-section-head"><div><b>关键能力</b><small>评审打开即可验证</small></div></div>
            <div class="act-capability-grid">
              <button onclick="openAgentCenter('checkpoints')"><i>◈</i><b>3 个人工检查点</b><small>角色 → 大纲 → 分集剧本</small></button>
              <button onclick="openAgentCenter('execution')"><i>◉</i><b>实时执行可视化</b><small>判断、状态与中间产物</small></button>
              <button onclick="openAgentCenter('evidence')"><i>▤</i><b>Agent Run 证据</b><small>完整输入输出与检查日志</small></button>
              <button onclick="openAgentCenter('delivery')"><i>⇄</i><b>开放交付接口</b><small>小云雀 / DramaClaw</small></button>
            </div>
          </section>

          <section class="act-panel" data-panel="checkpoints">
            <div class="act-panel-intro"><div><span>HUMAN IN THE LOOP</span><h3>人在回路 · 3 个决策检查点</h3><p>后端工作流在关键产物后暂停，评委可以确认、提出修改或直接编辑，再恢复下游执行。</p></div><div class="act-mini-status"><span></span><b id="hitlStatus">等待首个检查点</b></div></div>
            <div class="checkpoint-timeline" id="checkpointTimeline"></div>
            <aside class="checkpoint-inspector" id="checkpointInspector">
              <div class="ci-empty"><span>◇</span><b>尚未到达检查点</b><p>开始创作后，角色设定完成时将在这里暂停。</p></div>
            </aside>
          </section>

          <section class="act-panel" data-panel="execution">
            <div class="act-panel-intro"><div><span>LIVE EXECUTION</span><h3>专家执行过程</h3><p>实时显示当前专家、正在进行的判断和已产生的中间结果。</p></div><button class="act-ghost-btn" onclick="toggleRunEvidence()">打开原始证据流</button></div>
            <div class="execution-focus" id="executionFocus"><div class="ef-avatar">◉</div><div><small>CURRENT EXPERT</small><h3>系统待命</h3><p>输入创意并开始创作后，这里将实时更新。</p></div><span class="ef-pulse">WAITING</span></div>
            <div class="execution-list" id="executionList"></div>
          </section>

          <section class="act-panel" data-panel="evidence">
            <div class="act-panel-intro"><div><span>TRACEABLE AGENT RUN</span><h3>Agent Run 执行证据</h3><p>记录专家选择、每项判断、质量检查以及中间输入输出。</p></div><div class="act-actions"><button onclick="exportRunEvidence()">导出日志</button><button onclick="clearRunEvidence()">清空</button></div></div>
            <div class="run-meta-card"><div><small>RUN ID</small><b id="actEvidenceRunId">尚未开始</b></div><div><small>已调用专家</small><b id="actEvidenceExperts">0</b></div><div><small>质量检查</small><b id="actEvidenceChecks">0</b></div><div><small>中间产物</small><b id="actEvidenceOutputs">0</b></div></div>
            <div class="act-evidence-list" id="actEvidenceList"><div class="act-empty">等待任务启动，执行证据将在这里实时出现。</div></div>
          </section>

          <section class="act-panel" data-panel="assets">
            <div class="act-panel-intro"><div><span>READY-TO-USE ASSETS</span><h3>主打场景与风格经验包</h3><p>场景模板提供完整示例数据；风格包把专家知识与约束固化为可复用版本。</p></div></div>
            <div class="act-section-head"><div><b>主打场景</b><small>选择模板或直接载入完整示例</small></div></div>
            <div class="scene-card-grid" id="sceneCardGrid"></div>
            <div class="act-section-head"><div><b>风格经验包</b><small>版本化、可组合、可追溯</small></div><span id="activePackLabel">当前：电影质感</span></div>
            <div class="pack-card-grid" id="packCardGrid"></div>
          </section>

          <section class="act-panel" data-panel="delivery">
            <div class="act-panel-intro"><div><span>SESSION & DELIVERY</span><h3>进度持久化与下游交付</h3><p>刷新不丢进度，并将角色、场景、分镜等结构化产物交付至制作平台。</p></div></div>
            <div class="session-card">
              <div class="session-icon">◷</div><div><b>Session 自动续存</b><p id="sessionSavedAt">等待首次保存</p></div><span class="session-on">已开启</span>
              <button onclick="saveSession();refreshAgentCenter();showToast('当前进度已保存')">立即保存</button><button class="danger" onclick="clearCapabilitySession()">清除进度</button>
            </div>
            <div class="act-section-head"><div><b>结构化交付接口</b><small>统一 Schema，一键导出至下游制作流程</small></div></div>
            <div class="delivery-list">
              <article><span class="delivery-logo generic">{ }</span><div><b>通用制作包</b><small>角色设定 / 场景描述 / 分镜文本 / 全集剧本</small></div><em>JSON</em><button onclick="exportDownstreamPackage('generic')">导出</button></article>
              <article><span class="delivery-logo bird">云</span><div><b>小云雀</b><small>适配角色、场景和镜头生成字段</small></div><em>API READY</em><button onclick="exportDownstreamPackage('xiaoyunque')">导出</button></article>
              <article><span class="delivery-logo claw">D</span><div><b>DramaClaw</b><small>适配短剧工业化生产工作流</small></div><em>API READY</em><button onclick="exportDownstreamPackage('dramaclaw')">导出</button></article>
            </div>
            <div class="schema-preview"><header><b>输出 Schema 预览</b><span>application/json</span></header><pre>{
  "project": { "title": "...", "episodes": 40 },
  "characters": [{ "name": "...", "arc": "..." }],
  "scenes": [{ "location": "...", "shots": [] }],
  "episodes": [{ "hook": "...", "script": "..." }]
}</pre></div>
          </section>
        </main>
      </section>
    </div>`;

  function mount() {
    if (document.getElementById('agentCenterMask')) return;
    document.body.insertAdjacentHTML('beforeend', html);
    const top = document.querySelector('.top-bar');
    const trigger = document.getElementById('agentCenterTrigger');
    if (top && trigger) top.appendChild(trigger);
    const workspace = document.querySelector('.center-main-area');
    const strip = document.getElementById('agentLiveStrip');
    if (workspace && strip) workspace.insertBefore(strip, workspace.firstChild);
    renderStatic();
    bindTabs();
    refreshAgentCenter();
    setInterval(refreshAgentCenter, 900);
  }

  function renderStatic() {
    const cp = document.getElementById('checkpointTimeline');
    cp.innerHTML = checkpoints.map((item, index) => `<article class="checkpoint-row" data-step="${item.step}"><i>${index+1}</i><div><b>${item.title}</b><small>${item.desc}</small><em>${item.source}</em></div><span class="cp-state">未开始</span></article>`).join('');
    const list = document.getElementById('executionList');
    list.innerHTML = expertOrder.map((item, index) => `<article data-expert-card="${item[0]}"><i>${String(index+1).padStart(2,'0')}</i><span class="el-dot"></span><div><b>${item[1]}</b><small>${item[2]}</small></div><em>等待</em><button onclick="openExpertResult('${item[0]}')">产物</button></article>`).join('');
    document.getElementById('sceneCardGrid').innerHTML = Object.entries(sceneMeta).map(([key,item]) => `<article style="--scene:${item.color}"><span>${item.icon}</span><div><b>${item.name}</b><small>${item.desc}</small></div><button onclick="applyScenePreset('${key}');closeAgentCenter()">使用模板</button><button class="secondary" onclick="loadSceneExample('${key}');closeAgentCenter()">完整示例</button></article>`).join('');
    document.getElementById('packCardGrid').innerHTML = stylePacks.map(item => `<button data-pack-card="${item[0]}" onclick="chooseCapabilityPack('${item[0]}')"><span>${item[1]}</span><div><b>${item[2]}</b><small>${item[3]}</small></div><em>v1.0</em></button>`).join('');
  }

  function bindTabs() {
    document.getElementById('agentCenterTabs').addEventListener('click', event => {
      const button = event.target.closest('[data-tab]');
      if (button) switchTab(button.dataset.tab);
    });
  }
  function switchTab(tab) {
    document.querySelectorAll('#agentCenterTabs [data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.querySelectorAll('.act-panel').forEach(el => el.classList.toggle('active', el.dataset.panel === tab));
  }

  function getState() {
    const completed = Number(window.stepsCompleted || 0);
    const current = Number(window.currentStep || 0);
    const bridge = window.YJBackendBridge;
    const creating = typeof isCreating !== 'undefined' ? isCreating : window.isCreating;
    let storedRun = null; try { storedRun = JSON.parse(localStorage.getItem('yunjiang_agent_run_v4') || 'null'); } catch (_) {}
    const runState = storedRun || (typeof run !== 'undefined' ? run : window.run);
    const active = !!(creating || bridge?.active || document.body.classList.contains('engine-running'));
    const waiting = !!(window.stepWaiting || bridge?.checkpoint || document.body.classList.contains('awaiting-human'));
    let runtimeEvents = []; try { runtimeEvents = JSON.parse(localStorage.getItem('yunjiang_runtime_events_v1') || '[]'); } catch (_) {}
    const events = [...(Array.isArray(runState?.events) ? runState.events : []), ...(Array.isArray(runtimeEvents) ? runtimeEvents : [])]
      .filter((event, index, all) => all.findIndex(item => (item.event_id && item.event_id === event.event_id) || (!item.event_id && item.time === event.time && item.title === event.title)) === index);
    const experts = Array.isArray(runState?.experts) ? runState.experts : [];
    return { completed, current, bridge, active, waiting, events, experts, runState };
  }

  function refreshAgentCenter() {
    const root = document.getElementById('agentCenterMask'); if (!root) return;
    const s = getState();
    const status = s.waiting ? '等待人工决策' : s.active ? 'Agent 协作执行中' : s.completed >= 17 ? '运行已完成' : '系统待命';
    setText('agentCenterStatus', status); setText('actRunState', s.waiting ? '已暂停' : s.active ? '执行中' : s.completed >= 17 ? '已完成' : '待命');
    setText('actRunId', s.runState?.id || s.bridge?.workflowId || '尚未创建 Run');
    const progress = Math.min(17, Math.max(s.completed, s.current));
    setText('actExpertProgress', `${progress} / 17`); setText('alsCount', `${progress} / 17`);
    const bar = document.getElementById('alsProgressBar'); if (bar) bar.style.width = `${progress / 17 * 100}%`;
    setText('actCheckCount', Number(s.runState?.checks || 0)); setText('actOutputCount', Number(s.runState?.outputs || Object.keys(window.generatedResults || {}).length));
    setText('alsTitle', s.waiting ? '工作流已在检查点暂停' : s.active ? currentExpertName(s) + ' 正在执行' : s.completed >= 17 ? '本次 Agent Run 已完成' : 'Agent 协作引擎待命');
    setText('alsDetail', s.waiting ? '请进入「人在回路」确认或修改方向' : s.active ? currentExpertTask(s) : '决策层、执行层、监督层已就绪');
    document.getElementById('agentLiveStrip')?.classList.toggle('running', s.active); document.getElementById('agentLiveStrip')?.classList.toggle('waiting', s.waiting);
    refreshCheckpoints(s); refreshExecution(s); refreshEvidence(s); refreshAssets(); refreshSession();
  }

  function refreshCheckpoints(s) {
    let waitingCount = 0;
    document.querySelectorAll('.checkpoint-row').forEach(row => {
      const step = Number(row.dataset.step); let state = '未开始'; let cls = '';
      if ((s.bridge?.checkpoint?.step === step) || (s.waiting && s.current === step)) { state = '等待决策'; cls = 'waiting'; waitingCount++; }
      else if (s.completed >= step) { state = '已确认'; cls = 'done'; }
      else if (s.active && s.current < step) { state = '排队中'; cls = 'queued'; }
      row.className = `checkpoint-row ${cls}`; row.querySelector('.cp-state').textContent = state;
    });
    setText('checkpointBadge', waitingCount || 3); setText('hitlStatus', waitingCount ? '有检查点等待决策' : s.completed >= 7 ? '3 个检查点已通过' : '等待首个检查点');
    const inspector = document.getElementById('checkpointInspector');
    const cp = s.bridge?.checkpoint || (s.waiting ? checkpoints.find(x => x.step === s.current) : null);
    if (cp) {
      const meta = checkpoints.find(x => x.step === Number(cp.step)) || cp;
      inspector.innerHTML = `<div class="ci-head"><span>PAUSED</span><b>${meta.title || cp.title}</b><small>${meta.desc || cp.message || '请审核当前产物后决定下一步。'}</small></div><div class="ci-preview">${escapeHtml(String(window.generatedResults?.[cp.step] || '当前产物已生成，请在主画布查看完整内容。').slice(0,420))}</div><div class="ci-actions"><button onclick="confirmCurrentStep(${cp.step})">确认并继续</button><button onclick="showReviseInput(${cp.step});closeAgentCenter()">提出修改</button><button onclick="showEditArea(${cp.step});closeAgentCenter()">直接编辑</button></div>`;
    } else inspector.innerHTML = `<div class="ci-empty"><span>◇</span><b>${s.completed >= 7 ? '关键方向均已确认' : '尚未到达检查点'}</b><p>${s.completed >= 7 ? '角色、剧情大纲和分集剧本均已通过人工决策。' : '开始创作后，角色设定完成时将在这里暂停。'}</p></div>`;
  }

  function refreshExecution(s) {
    const activeEl = document.querySelector('[data-expert].working,[data-expert].active');
    const activeId = activeEl?.dataset.expert || '';
    document.querySelectorAll('[data-expert-card]').forEach((card, index) => {
      const id = card.dataset.expertCard; const source = document.querySelector(`[data-expert="${id}"]`);
      const done = !!source?.classList.contains('completed') || !!source?.classList.contains('done') || index < s.completed;
      const active = id === activeId;
      card.classList.toggle('done', done); card.classList.toggle('working', active);
      card.querySelector('em').textContent = active ? '执行中' : done ? '已完成' : '等待';
    });
    const focus = document.getElementById('executionFocus'); const name = currentExpertName(s); const task = currentExpertTask(s);
    const latestSkill = s.events.slice().reverse().find(event => event.skill)?.skill;
    const skillLine = latestSkill ? `<p><b>Skill</b> · ${escapeHtml(latestSkill.name || latestSkill.id)} v${escapeHtml(latestSkill.version || '1.0.0')} · ${escapeHtml((latestSkill.checks || []).join(' / '))}</p>` : '';
    focus.classList.toggle('working', s.active); focus.innerHTML = `<div class="ef-avatar">${s.active ? '◉' : '◇'}</div><div><small>CURRENT EXPERT</small><h3>${escapeHtml(name)}</h3><p>${escapeHtml(task)}</p>${skillLine}</div><span class="ef-pulse">${s.waiting ? 'PAUSED' : s.active ? 'RUNNING' : 'WAITING'}</span>`;
  }

  function refreshEvidence(s) {
    setText('actEvidenceRunId', s.runState?.id || s.bridge?.workflowId || '尚未开始'); setText('actEvidenceExperts', s.experts.length || s.completed);
    setText('actEvidenceChecks', Number(s.runState?.checks || 0)); setText('actEvidenceOutputs', Number(s.runState?.outputs || Object.keys(window.generatedResults || {}).length));
    const list = document.getElementById('actEvidenceList'); if (!list) return;
    if (!s.events.length) { list.innerHTML = '<div class="act-empty">等待任务启动，执行证据将在这里实时出现。</div>'; return; }
    list.innerHTML = s.events.slice().reverse().slice(0,80).map(event => { const skill = event.skill; return `<article class="${escapeHtml(event.type || '')}"><time>${new Date(event.time || event.timestamp || Date.now()).toLocaleTimeString('zh-CN',{hour12:false})}</time><span></span><div><b>${escapeHtml(event.title || event.type || '运行事件')}</b><p>${escapeHtml(event.detail || event.task || event.output_preview || '')}</p>${event.expert ? `<em>${escapeHtml(event.expert)}</em>` : ''}${skill ? `<em>Skill: ${escapeHtml(skill.name || skill.id)} v${escapeHtml(skill.version || '1.0.0')}</em>` : ''}</div></article>`; }).join('');
  }

  function refreshAssets() {
    const active = localStorage.getItem('yunjiang_style_pack_v1') || window.activeStylePack || 'cinematic';
    document.querySelectorAll('[data-pack-card]').forEach(el => el.classList.toggle('active', el.dataset.packCard === active));
    const pack = stylePacks.find(x => x[0] === active); setText('activePackLabel', '当前：' + (pack?.[2] || active));
  }
  function refreshSession() {
    let data = null; try { data = JSON.parse(localStorage.getItem('yunjiang_active_session_v4') || 'null'); } catch (_) {}
    setText('sessionSavedAt', data?.savedAt ? `最近保存：${new Date(data.savedAt).toLocaleString('zh-CN')}` : '等待首次保存');
  }
  function currentExpertName(s) { const el = document.querySelector('[data-expert].working,[data-expert].active'); return el?.querySelector('.expert-name-sm')?.childNodes?.[0]?.textContent?.trim() || (s.waiting ? '人工决策检查点' : s.active ? 'Agent Orchestrator' : '系统待命'); }
  function currentExpertTask(s) { const el = document.querySelector('[data-expert].working,[data-expert].active'); return el?.querySelector('.expert-role-desc')?.textContent?.trim() || (s.waiting ? '审核当前产物并确认、修改或直接编辑' : s.active ? '正在编排专家与同步中间产物' : '输入创意并开始创作后，这里将实时更新'); }
  function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  window.openAgentCenter = tab => { document.getElementById('agentCenterMask')?.classList.add('open'); document.body.classList.add('agent-center-open'); switchTab(tab || 'overview'); refreshAgentCenter(); };
  window.closeAgentCenter = () => { document.getElementById('agentCenterMask')?.classList.remove('open'); document.body.classList.remove('agent-center-open'); };
  window.refreshAgentCenter = refreshAgentCenter;
  window.chooseCapabilityPack = id => { window.selectStylePack?.(id); localStorage.setItem('yunjiang_style_pack_v1', id); refreshAssets(); window.showToast?.('已切换风格经验包'); };
  window.openExpertResult = id => { const source = document.querySelector(`[data-expert="${id}"]`); if (!source || (!source.classList.contains('done') && !source.classList.contains('completed'))) { window.showToast?.('该专家尚未生成产物'); return; } closeAgentCenter(); const step = Number(source.dataset.step || 0); if (step) window.scrollToCanvasSection?.(`step-card-${step}`); };
  window.clearCapabilitySession = () => { if (!confirm('确定清除本地 Session 进度吗？\n已生成的当前页面内容不会立即消失，但刷新后无法恢复。')) return; localStorage.removeItem('yunjiang_active_session_v4'); localStorage.removeItem('yunjiang_session_v3'); localStorage.removeItem('yunjiang_session_v2'); refreshSession(); window.showToast?.('本地 Session 已清除'); };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
