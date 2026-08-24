/* 云匠 v10 功能增强层 */
(function(){
  const SESSION_KEY='yunjiang_active_session_v4', LOG_KEY='yunjiang_agent_run_v4';
  const presets={
    heritage:'非遗短剧：濒临失传的景泰蓝技艺传人林砚，为保住祖父留下的老作坊，与只看商业回报的投资人顾沉舟达成30天对赌。每集围绕一道真实工序推进，兼具技艺细节、家族秘密与情感拉扯，结尾必须有强钩子。',
    male:'男频爽文：被豪门逐出的养子陆沉隐姓埋名三年，真实身份是掌控全球新能源专利的幕后创始人。订婚宴上他被当众羞辱后不再隐忍，从身份揭晓、商业反杀到家族真相层层升级，节奏快、打脸密、每集一个爽点。',
    campus:'校园甜宠：高冷竞赛学神江屿被迫与元气广播站站长夏栀搭档完成校园纪录片，两人从互相嫌弃到共同守护即将撤销的旧礼堂。加入错位暗恋、社团竞争和毕业倒计时，清甜克制、细节有青春感。'
  };
  const sceneExamples={
    heritage:{1:'核心创意：以景泰蓝最后一炉为倒计时装置，让每道真实工序都推动一次人物选择。',5:'林砚｜27岁｜景泰蓝传人｜外冷内热，守艺但不守旧。\n顾沉舟｜31岁｜投资人｜理性锋利，隐藏动机是寻找母亲遗作。\n周伯｜62岁｜点蓝师｜掌握十年前火灾真相。',6:'第1-3集：作坊被封，30天对赌成立；第4-12集：技艺直播出圈，配方泄露；第13-24集：家族秘密与商业围猎并发；第25-30集：失传工艺复原，价值观终极对决。',7:'第1集《最后一炉》\n1-1 云匠作坊 日/内\n人物：林砚、周伯\n△封条落下，林砚把未完成的铜胎护进怀里。\n林砚：炉火还热，云匠就没有关门。\n△门外，顾沉舟展开30天对赌协议。',17:'监督层终审：文化信息可溯源，主角目标清晰，首集钩子强度通过。'},
    male:{1:'核心创意：每次身份揭晓都解决一个局部冲突，同时打开更大的权力谜题。',5:'陆沉｜29岁｜新能源幕后创始人｜隐忍、精确、底线极强。\n苏晚｜27岁｜并购律师｜不慕强，只尊重证据。\n陆震海｜58岁｜家主｜把血缘当筹码。',6:'第1-5集订婚宴反杀；第6-15集专利围猎；第16-25集身世与资本局交叉反转；第26-30集董事会终局。',7:'第1集《他不装了》\n1-1 酒店宴会厅 夜/内\n△酒杯碎在陆沉脚边。\n陆沉：这杯酒，我敬你们最后一次无知。\n△大屏亮起，全球专利授权人签名正是陆沉。',17:'监督层终审：爽点密度、反杀因果和身份递进检查通过。'},
    campus:{1:'核心创意：用毕业倒计时和旧礼堂保卫战承载一段克制的双向暗恋。',5:'夏栀｜18岁｜广播站站长｜热烈细腻，害怕告别。\n江屿｜18岁｜竞赛学神｜寡言可靠，用行动表达喜欢。\n许棠｜18岁｜学生会干部｜竞争者也是成长镜像。',6:'第1-8集被迫搭档；第9-18集纪录片与错位暗恋升温；第19-26集礼堂撤销危机；第27-30集毕业放映与告白。',7:'第1集《请保持收听》\n1-1 校园广播站 黄昏/内\n△夏栀误把试音推向全校。\n夏栀：江屿同学，你是不是——\n江屿：是。\n△全校安静三秒，广播骤停。',17:'监督层终审：青春语感、情感递进和校园合规检查通过。'}
  };
  const stylePacks={
    cinematic:'电影质感包：镜头驱动、留白克制、动作替代解释性台词，场景具备明确视觉母题。',
    hook:'强钩子爽感包：前10秒冲突、每集一次局势翻转、结尾悬念必须改变人物处境。',
    warm:'细腻共情包：以细节和潜台词推进关系，避免狗血误会，强调人物选择的情感代价。',
    heritage:'文化叙事包：文化信息必须进入冲突和行动，避免说明书式科普，术语需保持准确。'
  };
  let activeStylePack=localStorage.getItem('yunjiang_style_pack_v1')||'cinematic';
  let run={id:'',startedAt:'',events:[],experts:[],checks:0,outputs:0};
  try{run=JSON.parse(localStorage.getItem(LOG_KEY)||'null')||run}catch(e){}
  function esc(s){return String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
  window.addRunEvidence=function(type,title,detail,expert){
    if(!run.id){run.id='YJ-'+Date.now().toString(36).toUpperCase();run.startedAt=new Date().toISOString()}
    if(expert&&!run.experts.includes(expert))run.experts.push(expert);
    if(type==='check'||type==='checkpoint')run.checks++; if(type==='output'||type==='done')run.outputs++;
    run.events.push({time:new Date().toISOString(),type,title,detail:String(detail||'').slice(0,500),expert:expert||''});
    if(run.events.length>250)run.events=run.events.slice(-250);
    localStorage.setItem(LOG_KEY,JSON.stringify(run));renderEvidence();
  };
  function renderEvidence(){
    const log=document.getElementById('evidenceLog');if(!log)return;
    document.getElementById('evidenceRunId').textContent=run.id||'尚未开始';document.getElementById('evidenceExperts').textContent=run.experts.length;document.getElementById('evidenceChecks').textContent=run.checks;document.getElementById('evidenceOutputs').textContent=run.outputs;document.getElementById('evidenceBadge').textContent=run.events.length;
    log.innerHTML=run.events.length?run.events.slice().reverse().map(e=>'<div class="evidence-entry '+esc(e.type)+'"><div class="time">'+new Date(e.time).toLocaleTimeString('zh-CN',{hour12:false})+'</div><div class="title">'+esc(e.title)+'</div><div class="detail">'+esc(e.detail)+(e.expert?'\n专家：'+esc(e.expert):'')+'</div></div>').join(''):'<div class="evidence-entry"><div class="title">等待任务启动</div></div>';
  }
  window.toggleRunEvidence=()=>document.getElementById('runEvidencePanel').classList.toggle('open');
  window.clearRunEvidence=function(){run={id:'',startedAt:'',events:[],experts:[],checks:0,outputs:0};localStorage.removeItem(LOG_KEY);renderEvidence()};
  window.exportRunEvidence=function(){const blob=new Blob([JSON.stringify(run,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(run.id||'yunjiang-agent-run')+'.json';a.click();URL.revokeObjectURL(a.href)};
  function installEvidencePanel(){if(document.getElementById('runEvidencePanel'))return;document.body.insertAdjacentHTML('beforeend','<button class="evidence-trigger" id="evidenceTrigger" onclick="toggleRunEvidence()">▤ Agent Run 证据 <span id="evidenceBadge">0</span></button><aside class="run-evidence-panel" id="runEvidencePanel" aria-label="Agent Run 证据面板"><header><div><b>Agent Run 执行证据</b><small>专家选择、检查、输入与中间输出</small></div><button onclick="toggleRunEvidence()" aria-label="关闭">×</button></header><div class="evidence-stats"><span>Run ID<b id="evidenceRunId">尚未开始</b></span><span>专家<b id="evidenceExperts">0</b></span><span>检查<b id="evidenceChecks">0</b></span><span>产出<b id="evidenceOutputs">0</b></span></div><div class="evidence-actions"><button onclick="exportRunEvidence()">导出日志</button><button onclick="clearRunEvidence()">清空</button></div><div class="evidence-log" id="evidenceLog"><div class="evidence-entry"><div class="title">等待任务启动</div></div></div></aside>');}
  function downloadJSON(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function parseCharacters(text){return String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>{const m=line.match(/^([^｜|：:]{1,20})[｜|：:]\s*(.*)$/);return m?{name:m[1].trim(),profile:m[2].trim()}:null}).filter(Boolean)}
  function parseScenes(text){const lines=String(text||'').split(/\n+/),scenes=[];let scene=null;lines.forEach(line=>{const h=line.trim().match(/^(\d+[-－]\d+)\s+(.+?)\s+(日|夜|晨|黄昏|深夜|傍晚)\/?(内|外)?/);if(h){scene={id:h[1],location:h[2],time:h[3],space:h[4]||'',beats:[],dialogues:[]};scenes.push(scene)}else if(scene&&/^△/.test(line.trim()))scene.beats.push(line.trim().slice(1));else if(scene&&/[：:]/.test(line)){const p=line.split(/[：:]/);scene.dialogues.push({character:p.shift().trim(),line:p.join('：').trim()})}});return scenes}
  window.buildDownstreamPackage=function(){const idea=document.getElementById('ideaInput')?.value||'',script=generatedResults?.[7]||'';return{schema:'yunjiang.drama.production.v0.1',generatedAt:new Date().toISOString(),runId:run.id||null,project:{title:idea.slice(0,40)||'未命名短剧',concept:generatedResults?.[1]||idea,scenePreset:document.getElementById('ideaInput')?.dataset.scene||null,stylePack:activeStylePack},characters:parseCharacters(generatedResults?.[4]),outline:{series:generatedResults?.[6]||'',episodes:[]},scenes:parseScenes(script),storyboard:parseScenes(script).flatMap(s=>s.beats.map((beat,i)=>({sceneId:s.id,shot:i+1,visual:beat,audio:s.dialogues[i]?.line||'',character:s.dialogues[i]?.character||''}))),raw:{characterDesign:generatedResults?.[4]||'',episodeScript:script},integration:{targets:['小云雀','DramaClaw','通用视频生成平台'],contentType:'application/json',version:'0.1'}}};
  window.exportDownstreamPackage=async function(target='generic'){
    let pack=null,source='浏览器兼容导出';
    if(window.YJBackendBridge?.workflowId&&window.YJBackendBridge?.available){
      try{const response=await fetch(window.YJBackendBridge.base+'/api/v1/export/'+encodeURIComponent(window.YJBackendBridge.workflowId)+'?target='+encodeURIComponent(target));if(!response.ok)throw new Error('HTTP '+response.status);pack=await response.json();source='后端规范化 StoryState';}catch(error){addRunEvidence('error','后端制作包导出失败',error.message,'开放接口');}
    }
    if(!pack)pack=buildDownstreamPackage();
    const counts=pack.counts||{characters:(pack.characters||pack.role_cards||[]).length,scenes:(pack.scenes||pack.scene_prompts||pack.timeline?.scenes||[]).length,shots:(pack.storyboard||pack.shot_list||pack.timeline?.shots||[]).length};
    downloadJSON(pack,'云匠-'+target+'-制作包-'+Date.now()+'.json');addRunEvidence('output','下游结构化制作包已导出',source+'｜角色 '+counts.characters+' · 场景 '+counts.scenes+' · 分镜 '+counts.shots,'开放接口');showToast('已导出 '+target+' 结构化制作包');
  };
  window.applyScenePreset=function(key){const el=document.getElementById('ideaInput');el.value=presets[key]||'';el.dataset.scene=key;localStorage.setItem('yunjiang_scene_preset_v1',key);el.dispatchEvent(new Event('input'));showToast('已载入'+({heritage:'非遗短剧',male:'男频爽文',campus:'校园甜宠'}[key])+'深度模板')};
  window.loadSceneExample=function(key){generatedResults={...sceneExamples[key]};stepsCompleted=17;currentStep=17;const el=document.getElementById('ideaInput');el.value=presets[key];el.dataset.scene=key;document.getElementById('welcomeScreen').style.display='none';showAllContent();addRunEvidence('output','载入场景示例','已载入角色、剧情大纲、首集剧本和监督层终审结果',key);saveSession();showToast('完整示例已载入，可直接复核与导出')};
  window.selectStylePack=function(key,silent){activeStylePack=stylePacks[key]?key:'cinematic';localStorage.setItem('yunjiang_style_pack_v1',activeStylePack);document.querySelectorAll('.style-pack-btn').forEach(b=>b.classList.toggle('active',b.dataset.pack===activeStylePack));if(!silent){saveSession();showToast('已启用风格经验包：'+({cinematic:'电影质感',hook:'强钩子爽感',warm:'细腻共情',heritage:'文化叙事'}[activeStylePack]))}};
  window.startQuickDemo=function(){
    const demo={...sceneExamples.heritage};
    generatedResults=demo;stepsCompleted=17;currentStep=17;document.getElementById('ideaInput').value=presets.heritage;document.getElementById('ideaInput').dataset.scene='heritage';document.getElementById('welcomeScreen').style.display='none';showAllContent();
    run={id:'DEMO-'+Date.now().toString(36).toUpperCase(),startedAt:new Date().toISOString(),events:[],experts:[],checks:0,outputs:0};
    const demoExperts=['实战指挥','灵魂捕手','合规守门员','项目配置师','角色铸造师','结构建筑师','对白大师','分集编剧','集纲审核员','场景工匠','格式工匠','质量审计','改稿编辑','视觉导演','商业操盘','剧本审核','质量总监'];
    demoExperts.forEach((expert,index)=>addRunEvidence('done','专家完成演示步骤 '+String(index+1).padStart(2,'0'),'已执行职责检查并写入可追溯中间产物',expert));
    [['角色设定检查点','用户可确认、修改或手动编辑人物方向','角色铸造师'],['剧情大纲检查点','三幕结构与集尾钩子通过监督层检查','结构建筑师'],['分集剧本检查点','首集正文已生成，等待人在回路确认','分集编剧'],['监督层终审','文化准确性、节奏与格式检查通过','质量总监']].forEach((x,i)=>addRunEvidence(i===3?'check':'checkpoint',x[0],x[1],x[2]));
    document.getElementById('runEvidencePanel').classList.add('open');saveSession();showToast('60秒评审演示已就绪：三个检查点与执行证据均可检视');
  };
  function saveSession(){try{localStorage.setItem(SESSION_KEY,JSON.stringify({version:3,idea:document.getElementById('ideaInput')?.value||'',scene:document.getElementById('ideaInput')?.dataset.scene||'',stylePack:activeStylePack,results:generatedResults||{},steps:stepsCompleted||0,current:currentStep||0,checkpoint:[4,6,7].includes(currentStep)?currentStep:0,backendWorkflowId:window.YJBackendBridge?.workflowId||'',lastBackendEventId:window.YJBackendBridge?.lastEventId||0,savedAt:new Date().toISOString()}))}catch(e){}}
  window.clearActiveSession=function(){localStorage.removeItem(SESSION_KEY);showToast('当前续存进度已清除')};
  function installLaunchpad(){let mount=document.getElementById('leftReviewLaunchpadMount');if(!mount){const panel=document.querySelector('.left-panel.sidebar-left,.left-panel');if(panel){mount=document.createElement('div');mount.id='leftReviewLaunchpadMount';panel.appendChild(mount)}}if(mount&&!document.getElementById('reviewLaunchpad'))mount.innerHTML='<div class="review-launchpad review-launchpad-left" id="reviewLaunchpad"><div><h3>评审快速入口</h3><p>载入完整示例，快速复核角色、集纲与剧本。</p><div class="scene-presets"><span><button class="scene-preset" onclick="applyScenePreset(\'heritage\')">🏛 非遗</button> <button class="example-link" onclick="loadSceneExample(\'heritage\')">示例</button></span><span><button class="scene-preset" onclick="applyScenePreset(\'male\')">⚡ 男频</button> <button class="example-link" onclick="loadSceneExample(\'male\')">示例</button></span><span><button class="scene-preset" onclick="applyScenePreset(\'campus\')">💗 甜宠</button> <button class="example-link" onclick="loadSceneExample(\'campus\')">示例</button></span></div></div><button class="quick-demo-btn" onclick="startQuickDemo()">▶ 60秒体验</button><button class="cancel-creation-btn" id="cancelCreationBtn" onclick="cancelCurrentCreation()">■ 取消当前创作</button></div>';updateCancelCreationButton()}
  window.updateCancelCreationButton=function(){const btn=document.getElementById('cancelCreationBtn');if(!btn)return;const active=!!(window.YJBackendBridge?.active||isCreating||document.body.classList.contains('engine-running'));btn.disabled=!active;btn.classList.toggle('is-active',active);btn.textContent=active?'■ 取消当前创作':'✓ 当前无进行中任务'};
  window.cancelCurrentCreation=async function(){const active=!!(window.YJBackendBridge?.active||isCreating||document.body.classList.contains('engine-running'));if(!active){showToast('当前没有进行中的创作');return}if(!confirm('确定取消当前创作吗？\n\n已生成的内容会保留，但当前运行将停止。'))return;const bridge=window.YJBackendBridge,workflowId=bridge?.workflowId;let backendCanceled=false;if(bridge?.active&&workflowId&&bridge.base){try{const response=await fetch(bridge.base+'/api/v1/cancel/'+encodeURIComponent(workflowId),{method:'POST'});backendCanceled=response.ok;if(!response.ok)addRunEvidence?.('error','后端取消未确认','HTTP '+response.status,'会话管理器')}catch(error){addRunEvidence?.('error','后端取消请求失败',error.message,'会话管理器')}}isCreating=false;pauseRequested=false;resumeRequested=false;stepWaiting=false;currentWaitingStep=0;if(stepResolve){const resolve=stepResolve;stepResolve=null;resolve('cancelled')}if(bridge){bridge.active=false;bridge.checkpoint=null;if(bridge.cancelController){bridge.cancelController.abort();bridge.cancelController=null}bridge.consuming=false}document.body.classList.remove('engine-running','engine-paused','awaiting-human');document.querySelectorAll('[data-expert].working,[data-expert].active').forEach(el=>el.classList.remove('working','active'));const btn=document.getElementById('generateBtn');if(btn){btn.disabled=false;btn.innerHTML='<span>继续新创作</span><span>▶</span>';btn.onclick=startCreation}const status=document.getElementById('engineStatusValue');if(status)status.textContent='已取消';addRunEvidence?.('checkpoint','用户取消当前创作',(backendCanceled?'后端工作流与前端事件流均已停止':'前端运行已停止')+'，现有产物已保留','会话管理器');saveSession?.();window.updateBackendBadge?.();updateCancelCreationButton();window.refreshAgentCenter?.();showToast(backendCanceled?'已取消后端工作流，现有内容已保留':'已停止当前创作，现有内容已保留')};
  function installCapabilityStrip(){const card=document.querySelector('.modern-input-card');if(!card||document.getElementById('capabilityStrip'))return;card.insertAdjacentHTML('beforebegin','<div class="capability-strip" id="capabilityStrip"><span class="cap-label">风格经验包</span><button class="style-pack-btn" data-pack="cinematic" onclick="selectStylePack(\'cinematic\')">电影质感</button><button class="style-pack-btn" data-pack="hook" onclick="selectStylePack(\'hook\')">强钩子爽感</button><button class="style-pack-btn" data-pack="warm" onclick="selectStylePack(\'warm\')">细腻共情</button><button class="style-pack-btn" data-pack="heritage" onclick="selectStylePack(\'heritage\')">文化叙事</button><span class="layer-badge on">决策层</span><span class="layer-badge on">执行层</span><span class="layer-badge on">监督层</span><span class="session-note">自动续存已开启</span></div>');selectStylePack(activeStylePack,true)}
  document.addEventListener('DOMContentLoaded',function(){installLaunchpad();installCapabilityStrip();installEvidencePanel();renderEvidence();const input=document.getElementById('ideaInput');if(input)input.addEventListener('input',saveSession);setInterval(()=>{if(window.isCreating||Object.keys(window.generatedResults||{}).length)saveSession()},5000);
    let s=null;try{s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){} if(s&&s.idea&&input&&!input.value){input.value=s.idea;input.dataset.scene=s.scene||'';activeStylePack=s.stylePack||activeStylePack;selectStylePack(activeStylePack,true);if(s.results&&Object.keys(s.results).length){generatedResults=s.results;stepsCompleted=Number(s.steps)||0;currentStep=Number(s.current)||stepsCompleted;document.getElementById('welcomeScreen').style.display='none';showAllContent();updateBroadcastNodes();updateExpertGroupProgress();addRunEvidence('done','Session 完整恢复',`恢复至步骤 ${stepsCompleted}/17${s.checkpoint?' · 检查点 '+s.checkpoint:''}`,'会话管理器');showToast('已恢复上次进度、生成结果与检查点状态')}else showToast('已恢复上次未完成的创作输入')} if(s?.backendWorkflowId)setTimeout(()=>window.recoverBackendSession?.(s),0);
  });
  const originalStart=window.startCreation;window.startCreation=async function(){run={id:'YJ-'+Date.now().toString(36).toUpperCase(),startedAt:new Date().toISOString(),events:[],experts:[],checks:0,outputs:0};addRunEvidence('done','决策层完成任务编排','已选择「'+activeStylePack+'」版本化风格包；后端将按专家职责注入硬约束','决策层 Agent');saveSession();return originalStart.apply(this,arguments)};
  const originalRun=window.runStepReal;window.runStepReal=async function(stepNum,idea,style,episodes){const p=window.stepPrompts&&window.stepPrompts[stepNum];const expert=p?.expert||p?.name||('专家'+stepNum);addRunEvidence('working','专家开始执行',p?.name||('步骤 '+stepNum),expert);try{const v=await originalRun.apply(this,arguments);const out=(window.generatedResults&&window.generatedResults[stepNum])||'';addRunEvidence('done','专家完成并产出中间结果',(p?.name||'步骤')+' · '+out.replace(/\s+/g,' ').slice(0,180),expert);if([4,6,7].includes(stepNum))addRunEvidence('checkpoint',({4:'角色设定',6:'剧情大纲',7:'分集剧本'}[stepNum])+'等待人工确认','可继续、提出修改意见或直接编辑',expert);saveSession();return v}catch(e){addRunEvidence('error','执行失败',e.message,expert);throw e}};
  const originalAudit=window.runStageSubAgent;window.runStageSubAgent=async function(stageNum){addRunEvidence('check','监督层开始阶段验收','阶段 '+stageNum+'：清单打分、责任定位与反馈回路','监督层 Agent');try{const v=await originalAudit.apply(this,arguments);addRunEvidence('check','监督层验收完成','不合格项已自动点名责任专家返工；通过项进入下一阶段','监督层 Agent');saveSession();return v}catch(e){addRunEvidence('error','监督层验收异常',e.message,'监督层 Agent');throw e}};
})();
/* v5 新后端桥：真实 Orchestrator SSE、三检查点决策和服务端 Agent Run 证据。 */
(function(){
  const EXPERT_STEP={"§10":13,"§0":1,"§2":2,"§8":3,"§1":4,"§3":6,"§4":5,"§5":7,"§12":16,"§11":11,"§6":9,"§7":10,"§9":12,"§13":8,"§14":14,"§16":17,"§15":15};
  const CHECKPOINTS={
    "§3":{step:4,source:"§1",next:"§11",title:"角色设定等待你的决策",message:"角色铸造师已经完成角色设定。确认、修改或直接编辑后，后端才会继续进入剧情结构与分集大纲。"},
    "§11":{step:6,source:"§12",next:"§7",title:"剧情大纲等待你的决策",message:"结构、分集目标和集纲审核已经完成。确认故事走向后，后端才会继续生成场景与格式化分集剧本。"},
    "§7":{step:7,source:"§6",next:null,title:"分集剧本等待你的决策",message:"场景设计与格式化剧本已经完成。确认后将进入质量审计、返工和最终签发流程。"}
  };
  const SOURCE_STEP={"§1":4,"§12":6,"§6":7};
  const bridge={available:false,active:false,workflowId:"",lastEventId:0,outputs:{},checkpoint:null,base:"",consuming:false,stylePacks:[]};
  window.YJBackendBridge=bridge;

  function apiBase(){
    if(typeof window.YJResolveEngineApiBase==="function")return window.YJResolveEngineApiBase();
    const hostname=String(window.location.hostname||"").toLowerCase();
    const isGitHubPages=hostname==="github.io"||hostname.endsWith(".github.io");
    const hosted=/^https?:$/.test(window.location.protocol)&&!isGitHubPages?window.location.origin:"";
    const raw=(window.YJ_ENGINE_API_BASE||window.YJ_API_BASE||hosted||"https://reasonable-magic-production-7faf.up.railway.app").replace(/\/$/,"");
    return raw.replace(/\/api\/v1$/i,"").replace(/\/v1$/i,"");
  }
  async function jsonFetch(path,options){
    const response=await fetch(bridge.base+path,{headers:{"Content-Type":"application/json",...(options&&options.headers||{})},...options});
    if(!response.ok)throw new Error((await response.text().catch(()=>""))||("HTTP "+response.status));
    return response.json();
  }
  bridge.connect=async function(){
    bridge.base=apiBase();
    if(!bridge.base)return false;
    try{
      const health=await fetch(bridge.base+"/health",{cache:"no-store"});
      if(!health.ok)throw new Error("health "+health.status);
      const experts=await fetch(bridge.base+"/api/v1/experts",{cache:"no-store"});
      bridge.available=experts.ok;
      if(bridge.available){
        const packsResponse=await fetch(bridge.base+"/api/v1/style-packs",{cache:"no-store"});
        if(packsResponse.ok){const data=await packsResponse.json();bridge.stylePacks=data.packs||[];document.querySelectorAll(".style-pack-btn").forEach(button=>{const pack=bridge.stylePacks.find(item=>item.id===button.dataset.pack);if(pack){button.title=pack.description+"｜v"+pack.version;button.dataset.version=pack.version;}});if(!bridge.stylePacks.some(item=>item.id===activeStylePack)){activeStylePack="cinematic";selectStylePack(activeStylePack,true);}}
      }
    }catch(error){bridge.available=false;}
    updateBackendBadge();
    return bridge.available;
  };
  function updateBackendBadge(){
    let badge=document.getElementById("backendLinkBadge");
    const strip=document.getElementById("capabilityStrip");
    if(strip&&!badge){badge=document.createElement("span");badge.id="backendLinkBadge";badge.className="layer-badge";strip.appendChild(badge);}
    if(badge){badge.classList.toggle("on",bridge.available);badge.textContent=bridge.available?(bridge.active?"后端执行中":"后端已连接"):"本地兼容模式";}
  }
  function resetBackendUI(){
    isCreating=true;pauseRequested=false;resumeRequested=false;stepsCompleted=0;currentStep=0;generatedResults={};
    document.body.classList.add("engine-running");document.body.classList.remove("engine-paused","awaiting-human");
    document.getElementById("welcomeScreen").style.display="none";document.getElementById("outputContainer").innerHTML="";
    document.querySelectorAll("[data-expert]").forEach(el=>el.classList.remove("completed","done","active","working"));
    const btn=document.getElementById("generateBtn");btn.disabled=false;btn.innerHTML="<span>后端创作中...</span><span>⏳</span>";btn.onclick=togglePauseResume;
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="连接后端";
  }
  function expertLabel(id){return ({"§10":"实战指挥","§0":"灵魂捕手","§2":"合规守门员","§8":"项目配置师","§1":"角色铸造师","§3":"结构建筑师","§4":"对白大师","§5":"分集编剧","§12":"集纲审核","§11":"场景工匠","§6":"格式工匠","§7":"质量审计","§9":"改稿编辑","§13":"视觉导演","§14":"商业操盘","§16":"剧本审核","§15":"品控总监"})[id]||id;}
  function renderBackendOutput(expertId,content){
    const stepNum=SOURCE_STEP[expertId]||EXPERT_STEP[expertId];if(!stepNum)return;
    const safe=sanitizeLLMOutput(content||"");bridge.outputs[expertId]=safe;generatedResults[stepNum]=safe;
    let card=document.getElementById("step-card-"+stepNum);
    const prompt=stepPrompts[stepNum]||{};const step=stepData[stepNum]||{};
    if(!card){card=document.createElement("div");card.className="output-card";card.id="step-card-"+stepNum;card.innerHTML='<div class="output-header"><div class="output-icon">'+(step.icon||"🔧")+'</div><div><div class="output-title">'+(step.title||expertLabel(expertId))+'</div><div class="output-meta">'+expertLabel(expertId)+' · 后端真实产物</div></div></div><div class="output-body"><div id="stream-content-'+stepNum+'"></div></div>';document.getElementById("outputContainer").appendChild(card);}
    const target=document.getElementById("stream-content-"+stepNum);if(target)target.innerHTML=renderMarkdown(safe);
    const nameMap={"§10":"mission_commander","§0":"soul_catcher","§2":"compliance_guard","§8":"project_configurator","§1":"character_forger","§3":"structure_architect","§4":"dialogue_master","§5":"episode_writer","§12":"episode_outline_reviewer","§11":"scene_craftsman","§6":"format_craftsman","§7":"quality_auditor","§9":"revision_editor","§13":"visual_director","§14":"business_strategist","§16":"script_reviewer","§15":"quality_director"};
    const el=document.querySelector('[data-expert="'+nameMap[expertId]+'"]');if(el){el.classList.remove("working","active");el.classList.add("done","completed");}
    stepsCompleted=Math.max(stepsCompleted,stepNum);currentStep=stepNum;updateBroadcastNodes();updateExpertGroupProgress();scrollToPageBottom();saveSession();
  }
  function markWorking(event){
    const id=event.expert_id,step=EXPERT_STEP[id];currentStep=step||currentStep;
    document.querySelectorAll("[data-expert]").forEach(el=>el.classList.remove("active","working"));
    const names={"§10":"mission_commander","§0":"soul_catcher","§2":"compliance_guard","§8":"project_configurator","§1":"character_forger","§3":"structure_architect","§4":"dialogue_master","§5":"episode_writer","§12":"episode_outline_reviewer","§11":"scene_craftsman","§6":"format_craftsman","§7":"quality_auditor","§9":"revision_editor","§13":"visual_director","§14":"business_strategist","§16":"script_reviewer","§15":"quality_director"};
    const el=document.querySelector('[data-expert="'+names[id]+'"]');if(el)el.classList.add("active","working");
    const task=document.getElementById("statusTaskInfo");if(task)task.textContent="· "+expertLabel(id)+"正在执行真实后端任务";
    addRunEvidence("working","专家开始执行",event.task||expertLabel(id),expertLabel(id));
  }
  function showBackendCheckpoint(stopExpert){
    const cp=CHECKPOINTS[stopExpert];if(!cp)return;bridge.checkpoint={...cp,stopExpert};
    const sourceText=bridge.outputs[cp.source]||generatedResults[cp.step]||"";if(sourceText){generatedResults[cp.step]=sourceText;renderBackendOutput(cp.source,sourceText);}
    document.getElementById("action-btns-"+cp.step)?.remove();
    const panel=document.createElement("div");panel.className="step-action-btns checkpoint-dialog";panel.id="action-btns-"+cp.step;
    panel.innerHTML='<div class="checkpoint-bubble"><div class="checkpoint-title">'+cp.title+'</div><div class="checkpoint-message">'+cp.message+'</div><div class="checkpoint-actions"><button class="step-btn step-btn-confirm" onclick="confirmCurrentStep('+cp.step+')">确认并继续</button><button class="step-btn step-btn-revise" onclick="showReviseInput('+cp.step+')">提出修改意见</button><button class="step-btn step-btn-edit" onclick="showEditArea('+cp.step+')">直接编辑</button></div></div>';
    document.getElementById("outputContainer").appendChild(panel);currentWaitingStep=cp.step;stepWaiting=true;document.body.classList.add("awaiting-human");
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="等待决策";
    addRunEvidence("checkpoint",cp.title,"后端工作流已真实暂停；确认前不会运行下游专家",expertLabel(cp.source));scrollToPageBottom();saveSession();
  }
  bridge.handleEvent=function(event){
    try{const key="yunjiang_runtime_events_v1",events=JSON.parse(localStorage.getItem(key)||"[]");events.push({...event,time:event.time||event.timestamp||new Date().toISOString(),title:event.title||event.type});localStorage.setItem(key,JSON.stringify(events.slice(-200)))}catch(error){}
    if(event.event_id)bridge.lastEventId=Math.max(bridge.lastEventId,event.event_id);
    if(event.type==="expert_start")markWorking(event);
    else if(event.type==="expert_complete"){
      renderBackendOutput(event.expert_id,event.output||event.output_preview||"");
      addRunEvidence("done","专家完成并写入产物",(event.output_preview||"").replace(/\s+/g," ").slice(0,220),expertLabel(event.expert_id));
    }else if(event.type==="style_pack_loaded"){
      const pack=event.style_pack||{};addRunEvidence("done","后端风格经验包已锁定",(pack.name||pack.id||"默认风格")+" v"+(pack.version||"1.0.0")+"｜校验 "+String(pack.checksum||"").slice(0,12),"风格包注册中心");
    }else if(event.type==="production_exported"){
      const counts=event.counts||{};addRunEvidence("output","后端制作包生成完成",event.target+"｜角色 "+(counts.characters||0)+" · 场景 "+(counts.scenes||0)+" · 分镜 "+(counts.shots||0),"开放接口");
    }else if(event.type==="decision_plan"){
      const plan=event.plan||{},selected=plan.selected_experts||[],why=(plan.rationale||[]).join("；");
      addRunEvidence("done","决策层生成协作计划","已选择 "+selected.length+" 位专家｜"+(why||"按产物依赖分阶段执行"),"决策层 Agent");
    }else if(event.type==="supervision_verdict"){
      const verdict=event.verdict||{},passed=verdict.passed!==false,target=verdict.responsible_expert?"｜责任专家 "+expertLabel(verdict.responsible_expert):"";
      addRunEvidence(passed?"check":"checkpoint",passed?"监督层验收通过":"监督层发现问题",(verdict.reason||"已完成结构化裁决")+target,"监督层 Agent");
    }else if(event.type==="feedback_dispatch"){
      const feedback=event.feedback||{};
      addRunEvidence("check","监督层定向派发返工","仅退回 "+expertLabel(event.target_expert)+"｜第 "+(feedback.retry||1)+" 次｜"+((feedback.validation_errors||[]).join("；")||feedback.reason||"修复当前产物"),"监督层 Agent");
    }else if(event.type==="quality_gate")addRunEvidence("check","质量门禁完成",JSON.stringify(event.result||{}).slice(0,420),expertLabel(event.expert_id));
    else if(event.type==="revision_loop")addRunEvidence("check","监督层触发返工","第 "+event.revision+" 轮局部返工","监督层 Agent");
    else if(event.type==="checkpoint")showBackendCheckpoint(event.expert_id);
    else if(event.type==="workflow_error"){addRunEvidence("error","后端工作流异常",event.error||"未知错误","Orchestrator");finishBackend(false,event.error);}
    else if(event.type==="workflow_state"&&event.status==="completed")finishBackend(true);
    saveSession();
  };
  bridge.consume=async function(){
    if(bridge.consuming||!bridge.workflowId)return;bridge.consuming=true;
    try{
      bridge.cancelController=new AbortController();
      const response=await fetch(bridge.base+"/api/v1/events/"+encodeURIComponent(bridge.workflowId)+"?after="+bridge.lastEventId,{headers:{Accept:"text/event-stream"},signal:bridge.cancelController.signal});
      if(!response.ok)throw new Error("事件流连接失败 "+response.status);
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="";
      while(true){const part=await reader.read();if(part.done)break;buffer+=decoder.decode(part.value,{stream:true});const blocks=buffer.split("\n\n");buffer=blocks.pop()||"";for(const block of blocks){const line=block.split("\n").find(x=>x.startsWith("data:"));if(!line)continue;try{const event=JSON.parse(line.slice(5).trim());if(event.type!=="heartbeat")bridge.handleEvent(event);}catch(error){}}}
    }catch(error){if(error.name!=="AbortError"){addRunEvidence("error","SSE连接中断",error.message,"事件桥");showToast("后端事件流中断，可从断点恢复",true);}}finally{bridge.consuming=false;bridge.cancelController=null;updateBackendBadge();updateCancelCreationButton?.();}
  };
  window.recoverBackendSession=async function(session){
    if(!session?.backendWorkflowId||bridge.active)return false;
    if(!await bridge.connect())return false;
    bridge.workflowId=session.backendWorkflowId;bridge.lastEventId=Number(session.lastBackendEventId)||0;
    try{
      const progress=await jsonFetch("/api/v1/progress/"+encodeURIComponent(bridge.workflowId));
      if(progress.status==="completed"||progress.status==="canceled"||progress.status==="failed")return false;
      bridge.active=true;isCreating=true;document.body.classList.add("engine-running");
      addRunEvidence("done","后端 Session 已重新连接","从事件 #"+bridge.lastEventId+" 继续接收；后端状态 "+progress.status,"会话管理器");
      updateBackendBadge();updateCancelCreationButton?.();bridge.consume();return true;
    }catch(error){return false;}
  };
  bridge.start=async function(idea){
    const settings=loadSettings(),packId=(localStorage.getItem("yunjiang_style_pack_v1")||"cinematic"),packMeta=bridge.stylePacks.find(item=>item.id===packId)||{};const payload={story_direction:idea,drama_type:selectedStyle||null,total_episodes:settings.episodeCount||30,style_pack_id:packId,style_pack_version:packMeta.version||null,stop_at:"§3"};
    const data=await jsonFetch("/api/v1/create",{method:"POST",body:JSON.stringify(payload)});bridge.workflowId=data.workflow_id;bridge.lastEventId=0;bridge.outputs={};bridge.active=true;updateCancelCreationButton?.();
    run.id=bridge.workflowId;run.startedAt=new Date().toISOString();addRunEvidence("done","后端工作流已创建","首个人工暂停点：角色设定","决策层 Agent");updateBackendBadge();saveSession();bridge.consume();
  };
  async function finishBackend(ok,error){
    if(!ok){const status=document.getElementById("engineStatusValue");if(status)status.textContent="执行异常";return;}
    bridge.active=false;isCreating=false;document.body.classList.remove("engine-running","awaiting-human");
    const btn=document.getElementById("generateBtn");btn.disabled=false;btn.innerHTML="<span>再来一版</span><span>↻</span>";btn.onclick=startCreation;
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="已完成";
    addRunEvidence("done","后端工作流完成","17位专家、门禁与返工链路执行结束","Orchestrator");saveCurrentSessionToHistory();saveSession();updateBackendBadge();showToast("后端真实工作流已完成");
  }
  const fallbackStart=window.startCreation;
  window.startCreation=async function(){
    const idea=document.getElementById("ideaInput").value.trim();if(!idea){showToast("请输入你的短剧想法",true);return;}
    if(await bridge.connect()){
      try{run={id:"",startedAt:new Date().toISOString(),events:[],experts:[],checks:0,outputs:0};resetBackendUI();await bridge.start(idea);return;}catch(error){bridge.active=false;addRunEvidence("error","新版后端启动失败",error.message,"连接桥");showToast("新版后端不可用，已切换兼容模式",true);}
    }
    return fallbackStart.apply(this,arguments);
  };
  const localConfirm=window.confirmCurrentStep;
  window.confirmCurrentStep=async function(stepNum){
    if(!bridge.active||!bridge.checkpoint||bridge.checkpoint.step!==stepNum)return localConfirm(stepNum);
    const cp=bridge.checkpoint;try{
      await jsonFetch("/api/v1/workflow/"+encodeURIComponent(bridge.workflowId)+"/checkpoint",{method:"POST",body:JSON.stringify({expert_id:cp.source,edited_content:generatedResults[stepNum]||bridge.outputs[cp.source]||"",stop_at:cp.next})});
      document.getElementById("action-btns-"+stepNum)?.remove();document.body.classList.remove("awaiting-human");stepWaiting=false;currentWaitingStep=0;bridge.checkpoint=null;
      addRunEvidence("checkpoint","人工决策已写回后端","已确认 "+expertLabel(cp.source)+(cp.next?"；下一暂停点 "+cp.next:"；进入终审"),"人在回路");
      await jsonFetch("/api/v1/resume/"+encodeURIComponent(bridge.workflowId),{method:"POST",body:JSON.stringify({stop_at:cp.next})});bridge.consume();
    }catch(error){showToast("确认写回失败："+error.message,true);addRunEvidence("error","人工决策写回失败",error.message,"人在回路");}
  };
  const localSubmitRevise=window.submitRevise;
  window.submitRevise=async function(stepNum){
    if(!bridge.active||!bridge.checkpoint||bridge.checkpoint.step!==stepNum)return localSubmitRevise(stepNum);
    const input=document.getElementById("revise-input-"+stepNum),feedback=input&&input.value.trim();if(!feedback){showToast("请输入修改意见",true);return;}
    const cp=bridge.checkpoint,btns=document.getElementById("action-btns-"+stepNum);if(input.closest(".revise-input-area"))input.closest(".revise-input-area").remove();if(btns)btns.innerHTML='<span style="color:#9d526c;font-weight:600">后端专家修改中...</span>';
    try{
      const current=generatedResults[stepNum]||bridge.outputs[cp.source]||"";
      const data=await jsonFetch("/api/v1/step/"+encodeURIComponent(cp.source),{method:"POST",body:JSON.stringify({user_input:"当前产物：\n"+current+"\n\n修改意见：\n"+feedback+"\n\n请输出修改后的完整内容。",context:null})});
      generatedResults[stepNum]=data.content||current;bridge.outputs[cp.source]=generatedResults[stepNum];renderBackendOutput(cp.source,generatedResults[stepNum]);showBackendCheckpoint(cp.stopExpert);addRunEvidence("checkpoint","修改稿已返回检查点",feedback,expertLabel(cp.source));showToast("后端专家修改完成，请重新确认");
    }catch(error){showToast("后端修改失败："+error.message,true);showBackendCheckpoint(cp.stopExpert);}
  };
  const localExport=window.exportRunEvidence;
  window.exportRunEvidence=async function(){
    if(!bridge.workflowId)return localExport();
    try{const evidence=await jsonFetch("/api/v1/evidence/"+encodeURIComponent(bridge.workflowId));downloadJSON(evidence,bridge.workflowId+"-server-evidence.json");showToast("已导出后端真实运行证据");}catch(error){localExport();}
  };
  document.addEventListener("DOMContentLoaded",async function(){await bridge.connect();let saved=null;try{saved=JSON.parse(localStorage.getItem("yunjiang_active_session_v4")||"null");}catch(error){}if(saved&&saved.backendWorkflowId){bridge.workflowId=saved.backendWorkflowId;bridge.lastEventId=Number(saved.lastBackendEventId)||0;bridge.active=true;updateBackendBadge();bridge.consume();}});
})();

