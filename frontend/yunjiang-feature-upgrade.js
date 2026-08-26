/* 云匠 v10 功能增强层 */
(function(){
  const runtimeScript=document.currentScript;
  if(runtimeScript&&!document.getElementById('yj-page-scroll-style')){
    const pageScrollStyle=document.createElement('link');
    pageScrollStyle.id='yj-page-scroll-style';
    pageScrollStyle.rel='stylesheet';
pageScrollStyle.href=new URL('yunjiang-page-scroll.css?v=1.1.2',runtimeScript.src).href;
    document.head.appendChild(pageScrollStyle);
  }
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
  window.startQuickDemo=async function(options){
    options=options||{};
    if(window.__yjQuickDemoRunning)return window.__yjQuickDemoPromise;
    window.__yjQuickDemoRunning=true;
    const delay=options.instant?30:1200;
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const idea=options.idea||'非遗短剧《最后一炉》：景泰蓝传人林砚为保住祖父留下的老作坊，与投资人顾沉舟达成30天对赌。';
    const phases=[
      {
        key:'outline',step:1,icon:'📖',title:'故事大纲',expert:'soul_catcher',expertName:'灵魂捕手',
        summary:'确认核心冲突、四段式结构与情感落点',
        content:`# 《最后一炉》故事大纲

## 一句话故事
27岁的景泰蓝传人林砚，为保住祖父留下的老作坊，与只相信商业效率的投资人顾沉舟签下30天生死对赌；两人在修复“最后一炉”的过程中，发现十年前火灾与顾沉舟母亲遗作之间的秘密。

## 核心冲突
- **外部目标**：30天内完成失传的大器型景泰蓝“万山归蓝”，让作坊达到可持续经营条件。
- **人物矛盾**：林砚坚持手艺价值，顾沉舟强调市场结果，两人必须从对抗转向共同解决问题。
- **隐藏悬念**：顾沉舟并非偶然投资，他一直在寻找母亲生前未完成的最后一件作品。

## 四段式结构
1. **立局**：作坊被贴封条，林砚守着尚有余温的炉火；顾沉舟提出30天对赌。
2. **破局**：工艺直播意外出圈，但核心釉料配方外泄，师徒关系出现裂痕。
3. **逆局**：十年前火灾真相浮出水面，顾沉舟发现母亲遗作就在待修铜胎之中。
4. **终局**：众人放弃复制旧作，选择共同完成一件属于当代的新作品，作坊转型为开放工坊。

## 核心情感
守住传统，不是把它锁进过去，而是让它继续被今天的人使用。`
      },
      {
        key:'roles',step:4,icon:'👤',title:'人物小传',expert:'character_forger',expertName:'角色铸造师',
        summary:'建立角色目标、秘密、关系张力与成长弧',
        content:`# 人物小传

## 林砚｜27岁｜景泰蓝青年传人
外冷内热，工序严谨到近乎固执。父亲因作坊负债离开后，他把“守住祖父的炉火”当成唯一目标。**人物缺口**是只相信牺牲，不懂得经营与协作；最终学会让传统进入现代生活。

## 顾沉舟｜31岁｜文化消费投资人
判断快、语言锋利，习惯用数字控制风险。他投资作坊的隐藏动机，是寻找母亲十年前未完成的景泰蓝遗作。**人物缺口**是把情感包装成交易；最终承认自己真正想保存的是人与记忆。

## 周伯｜62岁｜老点蓝师
嘴硬心软，掌握十年前火灾真相。表面反对直播和商业化，实际上害怕自己的错误再次伤害年轻人。他是两位主角之间的“旧时代证人”。

## 关系主线
林砚与顾沉舟从“守艺者 vs 投资人”转为“共同创作者”；周伯既是阻力，也是解开家族秘密的钥匙。`
      },
      {
        key:'episodes',step:6,icon:'🗂️',title:'集纲',expert:'structure_architect',expertName:'结构建筑师',
        summary:'拆解首三集目标、冲突、转折与集尾钩子',
        content:`# 首三集集纲

## 第1集《最后一炉》
**目标**：在封店前保住尚未出炉的最后一件铜胎。  
**冲突**：林砚拒绝顾沉舟的收购，债权人当场断电封炉。  
**转折**：顾沉舟不收购作坊，改为提出30天经营对赌。  
**集尾钩子**：铜胎内壁露出顾沉舟母亲名字的落款。

## 第2集《蓝色落款》
**目标**：确认落款来源，同时完成第一次公开烧蓝。  
**冲突**：周伯否认见过遗作，直播观众质疑工坊造假营销。  
**转折**：顾沉舟拿出母亲旧照片，背景正是十年前的云匠作坊。  
**集尾钩子**：周伯在无人处烧掉一张旧工序记录。

## 第3集《不能公开的配方》
**目标**：用直播订单证明作坊具备经营能力。  
**冲突**：客户要求公开釉料配方，林砚认为这是祖传底线。  
**转折**：顾沉舟提出只公开可验证的工艺标准，不公开核心比例。  
**集尾钩子**：后台突然出现一份完整配方，发送者署名“十年前的学徒”。`
      },
      {
        key:'script',step:7,icon:'📝',title:'正文剧本',expert:'episode_writer',expertName:'分集编剧',
        summary:'按可拍摄分场格式生成首集核心正文',
        content:`# 第1集《最后一炉》

## 1-1 云匠作坊·烧蓝间 日/内
**人物：林砚、周伯、债权执行员**

△ 炉温表停在八百二十度。铜胎在火中泛出暗红，细密的蓝色釉料像尚未凝固的海。

△ 门外传来金属碰撞声。封条被展开，执行员伸手去拉总闸。

**林砚**：再给我十二分钟。

**执行员**：法院文件写得很清楚，现在停工。

△ 林砚没有回头。他戴上防护镜，手里的长钳稳稳托住铜胎。

**周伯**（压低声音）：温度一断，这胎就废了。

**林砚**：炉火还热，云匠就没有关门。

△ 总闸被拉下。排风声骤停，烧蓝间只剩炉膛的余光。

## 1-2 云匠作坊·前厅 日/内
**人物：林砚、顾沉舟、执行员**

△ 顾沉舟穿过堆满纸箱的前厅，把一份文件放在落灰的工作台上。

**顾沉舟**：我可以买下这里，也可以让他们现在恢复供电。

**林砚**：然后把手工改成流水线？

**顾沉舟**：错。三十天，你证明它能活；证明不了，作坊和债务都归我。

△ 林砚翻到协议最后一页。纸角压着一张旧照片——年轻女人站在这间作坊里，怀中抱着一件未完成的铜胎。

△ 他猛地回头。炉中铜胎的内壁，被余火照出一行极小的落款。

**林砚**：顾清岚……是谁？

△ 顾沉舟第一次失去从容。

**顾沉舟**：我母亲。

**字幕：距离对赌结束，还有30天。**`
      }
    ];

    function renderDemoText(text){
      if(typeof renderMarkdown==='function')return renderMarkdown(text);
      return '<p>'+esc(text).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>';
    }
    function installRunner(){
      document.getElementById('yj-core-demo-runner')?.remove();
      const runner=document.createElement('section');
      runner.id='yj-core-demo-runner';
      runner.style.cssText='margin:0 0 18px;padding:16px 18px;border:1px solid rgba(139,92,246,.18);border-radius:16px;background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(245,243,255,.84));box-shadow:0 10px 30px rgba(76,29,149,.08);backdrop-filter:blur(18px);';
      runner.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px"><div><b style="color:#312e81">⚡ 核心引擎运行演示</b><div id="yj-core-demo-status" style="font-size:12px;color:#64748b;margin-top:3px">正在编排 4 个核心创作阶段</div></div><span style="font-size:11px;padding:5px 9px;border-radius:999px;background:#ede9fe;color:#7c3aed;font-weight:700">零 Token Demo</span></div><div style="height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden"><div id="yj-core-demo-progress" style="height:100%;width:0;background:linear-gradient(90deg,#8b5cf6,#3b82f6);transition:width .45s ease"></div></div><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px">'+phases.map((p,i)=>'<div id="yj-demo-phase-'+p.key+'" style="padding:8px;border-radius:10px;background:rgba(255,255,255,.72);border:1px solid rgba(203,213,225,.7);font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span>'+p.icon+'</span> '+(i+1)+'. '+p.title+'</div>').join('')+'</div>';
      const output=document.getElementById('outputContainer');
      output.parentNode.insertBefore(runner,output);
    }
    function appendOutput(phase){
      const card=document.createElement('article');
      card.className='output-card';card.id='target-'+phase.key;
      card.dataset.demoCore=phase.key;
      card.innerHTML='<div class="output-header"><div class="output-icon">'+phase.icon+'</div><div><div class="output-title">核心演示 · '+phase.title+'</div><div class="output-meta">'+phase.expertName+' · '+phase.summary+'</div></div><button class="output-edit-btn" onclick="toggleEditOutput('+phase.step+')">编辑</button></div><div class="output-body" id="output-body-'+phase.step+'">'+renderDemoText(phase.content)+'</div>';
      document.getElementById('outputContainer').appendChild(card);
      card.scrollIntoView({behavior:'smooth',block:'start'});
    }

    try{
      if(typeof window.YJOpenWorkspace==='function')window.YJOpenWorkspace();
      const input=document.getElementById('ideaInput');input.value=idea;input.dataset.scene='heritage';
      document.getElementById('welcomeScreen').style.display='none';
      document.getElementById('outputContainer').innerHTML='';
      generatedResults={};stepsCompleted=0;currentStep=0;isCreating=true;
      document.body.classList.add('engine-running','core-demo-mode');
      document.querySelectorAll('.sub-node-card').forEach(el=>el.classList.remove('working','done'));
      document.querySelectorAll('[data-expert]').forEach(el=>el.classList.remove('working','active','done'));
      installRunner();
      run={id:'CORE-DEMO-'+Date.now().toString(36).toUpperCase(),startedAt:new Date().toISOString(),events:[],experts:[],checks:0,outputs:0};
      addRunEvidence('done','决策层完成核心 Demo 编排','选择 4 个核心执行 Agent：故事、角色、结构、分集正文','实战指挥');
      updateCancelCreationButton?.();

      for(let i=0;i<phases.length;i++){
        const phase=phases[i],pill=document.getElementById('yj-demo-phase-'+phase.key),node=document.getElementById('bcNode-'+phase.key);
        document.querySelectorAll('[data-expert]').forEach(el=>el.classList.remove('working','active'));
        const expertEl=document.querySelector('[data-expert="'+phase.expert+'"]');if(expertEl)expertEl.classList.add('working','active');
        if(node)node.classList.add('working');
        pill.style.cssText+=';border-color:#8b5cf6;background:#f5f3ff;color:#6d28d9;font-weight:700;';
        document.getElementById('yj-core-demo-status').textContent='正在执行：'+phase.expertName+' · '+phase.summary;
        document.getElementById('engineStatusValue').textContent='核心 Demo '+(i+1)+'/4';
        document.getElementById('statusTaskInfo').textContent=phase.expertName+' 正在生成'+phase.title;
        addRunEvidence('working',phase.expertName+'开始执行',phase.summary,phase.expertName);
        await sleep(delay);
        generatedResults[phase.step]=phase.content;stepsCompleted=phase.step;currentStep=phase.step;
        appendOutput(phase);
        pill.style.cssText+=';border-color:#86efac;background:#f0fdf4;color:#15803d;';
        pill.innerHTML='✓ '+(i+1)+'. '+phase.title;
        if(node){node.classList.remove('working');node.classList.add('done')}
        if(expertEl){expertEl.classList.remove('working');expertEl.classList.add('done')}
        document.getElementById('yj-core-demo-progress').style.width=((i+1)*25)+'%';
        addRunEvidence('output',phase.title+'生成完成',phase.content.replace(/[#*\n]/g,' ').slice(0,220),phase.expertName);
        saveSession();
      }
      document.getElementById('yj-core-demo-status').textContent='核心链路运行完成 · 4 项产出均可阅读和编辑';
      document.getElementById('engineStatusValue').textContent='核心 Demo 完成';
      document.getElementById('statusTaskInfo').textContent='故事大纲、人物小传、集纲、正文剧本已生成';
      addRunEvidence('check','监督层完成核心产出检查','四项产出结构完整、人物动机一致、集尾钩子明确、正文格式可拍摄','质量总监');
      saveSession();showToast('核心引擎 Demo 已完成：4 项产出已写入工作台');
      return{ok:true,outputs:4,runId:run.id};
    }finally{
      isCreating=false;document.body.classList.remove('engine-running');window.__yjQuickDemoRunning=false;updateCancelCreationButton?.();window.refreshAgentCenter?.();
    }
  };
  function saveSession(){try{localStorage.setItem(SESSION_KEY,JSON.stringify({version:3,idea:document.getElementById('ideaInput')?.value||'',scene:document.getElementById('ideaInput')?.dataset.scene||'',stylePack:activeStylePack,results:generatedResults||{},steps:stepsCompleted||0,current:currentStep||0,checkpoint:[4,6,7].includes(currentStep)?currentStep:0,backendWorkflowId:window.YJBackendBridge?.workflowId||'',lastBackendEventId:window.YJBackendBridge?.lastEventId||0,savedAt:new Date().toISOString()}))}catch(e){}}
  // 后端桥位于独立作用域，通过这个小型公开接口共享必要状态，
  // 避免直接引用 activeStylePack、run、saveSession 等私有变量。
  window.YJFeatureRuntime={
    getStylePack:()=>activeStylePack,
    resetRun:()=>{run={id:'',startedAt:new Date().toISOString(),events:[],experts:[],checks:0,outputs:0};renderEvidence()},
    setRunIdentity:(id,startedAt)=>{run.id=id||run.id;run.startedAt=startedAt||run.startedAt||new Date().toISOString();localStorage.setItem(LOG_KEY,JSON.stringify(run));renderEvidence()},
    saveSession:saveSession,
    downloadJSON:downloadJSON
  };
  window.clearActiveSession=function(){localStorage.removeItem(SESSION_KEY);showToast('当前续存进度已清除')};
  function installLaunchpad(){let mount=document.getElementById('leftReviewLaunchpadMount');if(!mount){const panel=document.querySelector('.left-panel.sidebar-left,.left-panel');if(panel){mount=document.createElement('div');mount.id='leftReviewLaunchpadMount';panel.appendChild(mount)}}if(mount&&!document.getElementById('reviewLaunchpad'))mount.innerHTML='<div class="review-launchpad review-launchpad-left" id="reviewLaunchpad"><div><h3>评审快速入口</h3><p>载入完整示例，快速复核角色、集纲与剧本。</p><div class="scene-presets"><span><button class="scene-preset" onclick="applyScenePreset(\'heritage\')">🏛 非遗</button> <button class="example-link" onclick="loadSceneExample(\'heritage\')">示例</button></span><span><button class="scene-preset" onclick="applyScenePreset(\'male\')">⚡ 男频</button> <button class="example-link" onclick="loadSceneExample(\'male\')">示例</button></span><span><button class="scene-preset" onclick="applyScenePreset(\'campus\')">💗 甜宠</button> <button class="example-link" onclick="loadSceneExample(\'campus\')">示例</button></span></div></div><button class="quick-demo-btn" onclick="startQuickDemo()">▶ 60秒体验</button><button class="cancel-creation-btn" id="cancelCreationBtn" onclick="cancelCurrentCreation()">■ 取消当前创作</button></div>';updateCancelCreationButton()}
  window.updateCancelCreationButton=function(){const btn=document.getElementById('cancelCreationBtn');if(!btn)return;const hasDraft=!!(window.YJBackendBridge?.active||isCreating||document.body.classList.contains('engine-running')||document.getElementById('ideaInput')?.value.trim()||Object.keys(generatedResults||{}).length);btn.disabled=!hasDraft;btn.classList.toggle('is-active',hasDraft);btn.textContent=hasDraft?'■ 取消 / 清除当前创作':'✓ 当前工作台为空'};
  function askCancelDisposition(){return new Promise(resolve=>{document.getElementById('yj-cancel-choice')?.remove();const overlay=document.createElement('div');overlay.id='yj-cancel-choice';overlay.className='yj-cancel-choice';overlay.innerHTML='<div class="yj-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="yj-cancel-title"><div class="yj-cancel-mark">■</div><h3 id="yj-cancel-title">取消当前创作</h3><p>是否把当前已经生成的内容保存到“我的项目”？无论选择哪种方式，当前工作台都会恢复为空白。</p><div class="yj-cancel-summary"><span>当前进度</span><b>'+Math.max(0,stepsCompleted||0)+' / 17</b><span>已生成内容</span><b>'+Object.keys(generatedResults||{}).length+' 项</b></div><div class="yj-cancel-actions"><button data-choice="back">继续创作</button><button class="danger" data-choice="discard">不保存并清除</button><button class="primary" data-choice="save">保存到我的项目</button></div></div>';document.body.appendChild(overlay);overlay.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{const choice=btn.dataset.choice;overlay.remove();resolve(choice)}));overlay.addEventListener('click',event=>{if(event.target===overlay){overlay.remove();resolve('back')}});});}
  function saveDraftToProjects(){const input=document.getElementById('ideaInput'),idea=input?.value.trim()||'';const results=JSON.parse(JSON.stringify(generatedResults||{}));if(!idea&&!Object.keys(results).length)return false;const record={id:'YJ-PROJECT-'+Date.now().toString(36).toUpperCase(),title:idea?(idea.slice(0,30)+(idea.length>30?'...':'')):'未命名创作',time:new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),savedAt:new Date().toISOString(),status:stepsCompleted>=17?'已完成':'创作中止 · 可继续编辑',episodes:loadSettings?.().episodeCount||0,wordCount:Object.values(results).reduce((sum,text)=>sum+String(text||'').replace(/\s/g,'').length,0),completedSteps:stepsCompleted||0,idea,scene:input?.dataset.scene||'',stylePack:activeStylePack,results,agentRun:JSON.parse(JSON.stringify(run||{}))};if(typeof saveHistoryRecord==='function')saveHistoryRecord(record);else{const records=JSON.parse(localStorage.getItem('dramaHistory')||'[]');records.unshift(record);localStorage.setItem('dramaHistory',JSON.stringify(records.slice(0,50)))}return true;}
  function resetWorkspaceToBlank(){localStorage.removeItem(SESSION_KEY);localStorage.removeItem('yunjiang_runtime_events_v1');localStorage.removeItem(LOG_KEY);run={id:'',startedAt:'',events:[],experts:[],checks:0,outputs:0};renderEvidence();generatedResults={};stepsCompleted=0;currentStep=0;isCreating=false;pauseRequested=false;resumeRequested=false;stepWaiting=false;currentWaitingStep=0;window.currentHistoryIndex=null;const input=document.getElementById('ideaInput');if(input){input.value='';delete input.dataset.scene;}document.getElementById('outputContainer')?.replaceChildren();document.getElementById('backend-live-activity')?.remove();const welcome=document.getElementById('welcomeScreen');if(welcome)welcome.style.display='';document.body.classList.remove('engine-running','engine-paused','awaiting-human','core-demo-mode');document.querySelectorAll('[data-expert]').forEach(el=>el.classList.remove('completed','done','active','working'));document.querySelectorAll('.step-item').forEach(el=>{el.classList.remove('done','active');const state=el.querySelector('.step-status');if(state)state.textContent='待开始'});document.querySelectorAll('.step-expert-item').forEach(el=>{el.classList.remove('is-working','is-done');const state=el.querySelector('.expert-state');if(state)state.textContent='已就位'});const status=document.getElementById('engineStatusValue');if(status)status.textContent='就绪';const task=document.getElementById('statusTaskInfo');if(task)task.textContent='';const btn=document.getElementById('generateBtn');if(btn){btn.disabled=false;btn.innerHTML='<span>开始创作</span><span>▶</span>';btn.onclick=startCreation;}updateBroadcastNodes?.();updateExpertGroupProgress?.();window.updateBackendBadge?.();window.refreshAgentCenter?.();updateCancelCreationButton();}
  window.clearCreationCache=function(){resetWorkspaceToBlank();showToast('创作缓存已清除，工作台已恢复空白');};
  window.cancelCurrentCreation=async function(){const hasDraft=!!(window.YJBackendBridge?.active||isCreating||document.body.classList.contains('engine-running')||document.getElementById('ideaInput')?.value.trim()||Object.keys(generatedResults||{}).length);if(!hasDraft){showToast('当前工作台已经是空白状态');return}const choice=await askCancelDisposition();if(choice==='back')return;const bridge=window.YJBackendBridge,workflowId=bridge?.workflowId;let backendCanceled=false;if(bridge?.active&&workflowId&&bridge.base){try{const response=await fetch(bridge.base+'/api/v1/cancel/'+encodeURIComponent(workflowId),{method:'POST'});backendCanceled=response.ok}catch(error){addRunEvidence?.('error','后端取消请求失败',error.message,'会话管理器')}}if(stepResolve){const resolve=stepResolve;stepResolve=null;resolve('cancelled')}if(bridge){bridge.active=false;bridge.workflowId='';bridge.outputs={};bridge.checkpoint=null;if(bridge.cancelController){bridge.cancelController.abort();bridge.cancelController=null}bridge.consuming=false}const saved=choice==='save'&&saveDraftToProjects();addRunEvidence?.('checkpoint','用户取消当前创作',(backendCanceled?'后端工作流已停止；':'前端任务已停止；')+(saved?'当前内容已保存到我的项目':'当前内容未保存并已清除'),'会话管理器');resetWorkspaceToBlank();showToast(saved?'已保存到我的项目，工作台已清空':'当前创作已取消并彻底清除');};
  function installCapabilityStrip(){const card=document.querySelector('.modern-input-card');if(!card||document.getElementById('capabilityStrip'))return;card.insertAdjacentHTML('beforebegin','<div class="capability-strip" id="capabilityStrip"><span class="cap-label">风格经验包</span><button class="style-pack-btn" data-pack="cinematic" onclick="selectStylePack(\'cinematic\')">电影质感</button><button class="style-pack-btn" data-pack="hook" onclick="selectStylePack(\'hook\')">强钩子爽感</button><button class="style-pack-btn" data-pack="warm" onclick="selectStylePack(\'warm\')">细腻共情</button><button class="style-pack-btn" data-pack="heritage" onclick="selectStylePack(\'heritage\')">文化叙事</button><span class="layer-badge on">决策层</span><span class="layer-badge on">执行层</span><span class="layer-badge on">监督层</span><span class="session-note">自动续存已开启</span></div>');selectStylePack(activeStylePack,true)}
  document.addEventListener('DOMContentLoaded',function(){installLaunchpad();installCapabilityStrip();installEvidencePanel();renderEvidence();const input=document.getElementById('ideaInput');if(input)input.addEventListener('input',()=>{saveSession();updateCancelCreationButton()});setInterval(()=>{if(window.isCreating||Object.keys(window.generatedResults||{}).length)saveSession()},5000);
    localStorage.removeItem(SESSION_KEY);localStorage.removeItem(LOG_KEY);run={id:'',startedAt:'',events:[],experts:[],checks:0,outputs:0};renderEvidence();const originalView=window.viewHistoryDetail;if(typeof originalView==='function')window.viewHistoryDetail=function(index){const records=typeof getHistoryRecords==='function'?getHistoryRecords():[];const record=records[index];originalView(index);if(record){const ideaInput=document.getElementById('ideaInput');if(ideaInput){ideaInput.value=record.idea||record.title||'';if(record.scene)ideaInput.dataset.scene=record.scene;}if(record.stylePack)selectStylePack(record.stylePack,true);if(record.agentRun){run=record.agentRun;localStorage.setItem(LOG_KEY,JSON.stringify(run));renderEvidence();}updateCancelCreationButton();showToast('已从我的项目打开：'+(record.title||'未命名创作'))}};
  });
  const originalStart=window.startCreation;window.startCreation=async function(){document.body.classList.remove('core-demo-mode');run={id:'YJ-'+Date.now().toString(36).toUpperCase(),startedAt:new Date().toISOString(),events:[],experts:[],checks:0,outputs:0};addRunEvidence('done','决策层完成任务编排','已选择「'+activeStylePack+'」版本化风格包；后端将按专家职责注入硬约束','决策层 Agent');saveSession();return originalStart.apply(this,arguments)};
  const originalRun=window.runStepReal;window.runStepReal=async function(stepNum,idea,style,episodes){const p=window.stepPrompts&&window.stepPrompts[stepNum];const expert=p?.expert||p?.name||('专家'+stepNum);addRunEvidence('working','专家开始执行',p?.name||('步骤 '+stepNum),expert);try{const v=await originalRun.apply(this,arguments);const out=(window.generatedResults&&window.generatedResults[stepNum])||'';addRunEvidence('done','专家完成并产出中间结果',(p?.name||'步骤')+' · '+out.replace(/\s+/g,' ').slice(0,180),expert);if([4,6,7].includes(stepNum))addRunEvidence('checkpoint',({4:'角色设定',6:'剧情大纲',7:'分集剧本'}[stepNum])+'等待人工确认','可继续、提出修改意见或直接编辑',expert);saveSession();return v}catch(e){addRunEvidence('error','执行失败',e.message,expert);throw e}};
  const originalAudit=window.runStageSubAgent;window.runStageSubAgent=async function(stageNum){addRunEvidence('check','监督层开始阶段验收','阶段 '+stageNum+'：清单打分、责任定位与反馈回路','监督层 Agent');try{const v=await originalAudit.apply(this,arguments);addRunEvidence('check','监督层验收完成','不合格项已自动点名责任专家返工；通过项进入下一阶段','监督层 Agent');saveSession();return v}catch(e){addRunEvidence('error','监督层验收异常',e.message,'监督层 Agent');throw e}};
})();
/* v5 新后端桥：真实 Orchestrator SSE、三检查点决策和服务端 Agent Run 证据。 */
(function(){
  const feature=window.YJFeatureRuntime||{
    getStylePack:()=>localStorage.getItem("yunjiang_style_pack_v1")||"cinematic",
    resetRun:()=>{},setRunIdentity:()=>{},saveSession:()=>{},downloadJSON:()=>{}
  };
  const EXPERT_STEP={"§10":13,"§0":1,"§2":2,"§8":3,"§1":4,"§3":6,"§4":5,"§5":7,"§12":16,"§11":11,"§6":9,"§7":10,"§9":12,"§13":8,"§14":14,"§16":17,"§15":15};
  const CHECKPOINTS={
    "§3":{step:4,source:"§1",next:"§11",title:"角色设定等待你的决策",message:"角色铸造师已经完成角色设定。确认、修改或直接编辑后，后端才会继续进入剧情结构与分集大纲。"},
    "§11":{step:6,source:"§12",next:"§7",title:"剧情大纲等待你的决策",message:"结构、分集目标和集纲审核已经完成。确认故事走向后，后端才会继续生成场景与格式化分集剧本。"},
    "§7":{step:7,source:"§6",next:null,title:"分集剧本等待你的决策",message:"场景设计与格式化剧本已经完成。确认后将进入质量审计、返工和最终签发流程。"}
  };
  const SOURCE_STEP={"§1":4,"§12":6,"§6":7};
  const bridge={available:false,active:false,workflowId:"",lastEventId:0,outputs:{},checkpoint:null,base:"",consuming:false,stylePacks:[],lastConnectError:""};
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
      // Skills 是云端运行能力的稳定公开清单；专家展示接口仅作为可选扩展，
      // 不应阻断真实工作流启动。
      const skills=await fetch(bridge.base+"/api/v1/skills",{cache:"no-store"});
      bridge.available=skills.ok;
      if(bridge.available){
        const packsResponse=await fetch(bridge.base+"/api/v1/style-packs",{cache:"no-store"});
        if(packsResponse.ok){const data=await packsResponse.json();bridge.stylePacks=data.packs||[];document.querySelectorAll(".style-pack-btn").forEach(button=>{const pack=bridge.stylePacks.find(item=>item.id===button.dataset.pack);if(pack){button.title=pack.description+"｜v"+pack.version;button.dataset.version=pack.version;}});const activePackId=feature.getStylePack();if(!bridge.stylePacks.some(item=>item.id===activePackId)){window.selectStylePack?.("cinematic",true);}}
      }
      bridge.lastConnectError="";
    }catch(error){bridge.available=false;bridge.lastConnectError=error.message||"无法完成云端能力校验";}
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
    document.getElementById("welcomeScreen").style.display="none";document.getElementById("outputContainer").innerHTML="";bridge.completedExperts=0;
    document.querySelectorAll("[data-expert]").forEach(el=>el.classList.remove("completed","done","active","working"));
    const btn=document.getElementById("generateBtn");btn.disabled=false;btn.innerHTML="<span>后端创作中...</span><span>⏳</span>";btn.onclick=togglePauseResume;
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="连接后端";
    renderBackendActivity({state:"connecting",title:"正在连接云匠 Agent 引擎",detail:"建立实时事件通道，准备接收专家执行步骤",progress:0});
  }
  function expertLabel(id){return ({"§10":"实战指挥","§0":"灵魂捕手","§2":"合规守门员","§8":"项目配置师","§1":"角色铸造师","§3":"结构建筑师","§4":"对白大师","§5":"分集编剧","§12":"集纲审核","§11":"场景工匠","§6":"格式工匠","§7":"质量审计","§9":"改稿编辑","§13":"视觉导演","§14":"商业操盘","§16":"剧本审核","§15":"品控总监"})[id]||id;}
  function renderBackendActivity(options){
    const output=document.getElementById("outputContainer");if(!output)return;
    let panel=document.getElementById("backend-live-activity");
    if(!panel){panel=document.createElement("section");panel.id="backend-live-activity";panel.className="backend-live-activity";output.parentNode.insertBefore(panel,output);}
    const state=options?.state||"working",progress=Math.max(0,Math.min(17,Number(options?.progress)||0));
    panel.className="backend-live-activity is-"+state;
    panel.innerHTML='<div class="backend-live-icon">'+(state==="done"?"✓":state==="error"?"!":"✦")+'</div><div class="backend-live-copy"><div class="backend-live-eyebrow">当前执行步骤 <span>'+progress+' / 17</span></div><strong>'+esc(options?.title||"云匠引擎正在执行")+'</strong><p>'+esc(options?.detail||"正在等待后端返回实时事件")+'</p><div class="backend-live-track"><i style="width:'+Math.round(progress/17*100)+'%"></i></div></div><span class="backend-live-state">'+(state==="done"?"已完成":state==="error"?"异常":"实时运行中")+'</span>';
  }
  function renderBackendOutput(expertId,content){
    const stepNum=SOURCE_STEP[expertId]||EXPERT_STEP[expertId];if(!stepNum)return;
    const safe=sanitizeLLMOutput(content||"");bridge.outputs[expertId]=safe;generatedResults[stepNum]=safe;
    let card=document.getElementById("step-card-"+stepNum);
    const prompt=stepPrompts[stepNum]||{};const step=stepData[stepNum]||{};
    if(!card){card=document.createElement("div");card.className="output-card";card.id="step-card-"+stepNum;card.innerHTML='<div class="output-header"><div class="output-icon">'+(step.icon||"🔧")+'</div><div><div class="output-title">'+(step.title||expertLabel(expertId))+'</div><div class="output-meta">'+expertLabel(expertId)+' · 后端真实产物</div></div></div><div class="output-body"><div id="stream-content-'+stepNum+'"></div></div>';document.getElementById("outputContainer").appendChild(card);}
    const target=document.getElementById("stream-content-"+stepNum);if(target)target.innerHTML=renderMarkdown(safe);
    const nameMap={"§10":"mission_commander","§0":"soul_catcher","§2":"compliance_guard","§8":"project_configurator","§1":"character_forger","§3":"structure_architect","§4":"dialogue_master","§5":"episode_writer","§12":"episode_outline_reviewer","§11":"scene_craftsman","§6":"format_craftsman","§7":"quality_auditor","§9":"revision_editor","§13":"visual_director","§14":"business_strategist","§16":"script_reviewer","§15":"quality_director"};
    const el=document.querySelector('[data-expert="'+nameMap[expertId]+'"]');if(el){el.classList.remove("working","active");el.classList.add("done","completed");}
    bridge.completedExperts=Math.min(17,(bridge.completedExperts||0)+1);
    renderBackendActivity({state:"done",title:expertLabel(expertId)+"已完成当前步骤",detail:"产物已写入画布，正在等待下一位专家接续执行",progress:bridge.completedExperts});
    stepsCompleted=Math.max(stepsCompleted,stepNum);currentStep=stepNum;updateBroadcastNodes();updateExpertGroupProgress();feature.saveSession();
  }
  function markWorking(event){
    const id=event.expert_id,step=EXPERT_STEP[id];currentStep=step||currentStep;
    document.querySelectorAll("[data-expert]").forEach(el=>el.classList.remove("active","working"));
    const names={"§10":"mission_commander","§0":"soul_catcher","§2":"compliance_guard","§8":"project_configurator","§1":"character_forger","§3":"structure_architect","§4":"dialogue_master","§5":"episode_writer","§12":"episode_outline_reviewer","§11":"scene_craftsman","§6":"format_craftsman","§7":"quality_auditor","§9":"revision_editor","§13":"visual_director","§14":"business_strategist","§16":"script_reviewer","§15":"quality_director"};
    const el=document.querySelector('[data-expert="'+names[id]+'"]');if(el)el.classList.add("active","working");
    const task=document.getElementById("statusTaskInfo");if(task)task.textContent="· "+expertLabel(id)+"正在执行真实后端任务";
    const stepDataItem=window.stepData?.[step]||{};
    renderBackendActivity({state:"working",title:expertLabel(id)+"正在执行"+(stepDataItem.title?" · "+stepDataItem.title:""),detail:event.task||event.judgement||event.message||"正在分析输入、执行专业判断并生成中间结果",progress:Math.min(17,(bridge.completedExperts||0)+1)});
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
    addRunEvidence("checkpoint",cp.title,"后端工作流已真实暂停；确认前不会运行下游专家",expertLabel(cp.source));scrollToPageBottom();feature.saveSession();
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
    else if(event.type==="workflow_error"){renderBackendActivity({state:"error",title:"工作流执行异常",detail:event.error||"未知错误",progress:bridge.completedExperts||0});addRunEvidence("error","后端工作流异常",event.error||"未知错误","Orchestrator");finishBackend(false,event.error);}
    else if(event.type==="workflow_state"&&event.status==="completed")finishBackend(true);
    feature.saveSession();
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
    feature.setRunIdentity(bridge.workflowId,new Date().toISOString());addRunEvidence("done","后端工作流已创建","首个人工暂停点：角色设定","决策层 Agent");updateBackendBadge();feature.saveSession();bridge.consume();
  };
  async function finishBackend(ok,error){
    if(!ok){const status=document.getElementById("engineStatusValue");if(status)status.textContent="执行异常";return;}
    bridge.active=false;isCreating=false;document.body.classList.remove("engine-running","awaiting-human");
    const btn=document.getElementById("generateBtn");btn.disabled=false;btn.innerHTML="<span>再来一版</span><span>↻</span>";btn.onclick=startCreation;
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="已完成";
    renderBackendActivity({state:"done",title:"云匠 Agent 工作流已完成",detail:"17 位专家、质量门禁与交付链路均已完成，全部产物可在画布中查看",progress:17});
    addRunEvidence("done","后端工作流完成","17位专家、门禁与返工链路执行结束","Orchestrator");saveCurrentSessionToHistory();feature.saveSession();updateBackendBadge();showToast("后端真实工作流已完成");
  }
  const fallbackStart=window.startCreation;
  window.startCreation=async function(){
    const idea=document.getElementById("ideaInput").value.trim();if(!idea){showToast("请输入你的短剧想法",true);return;}
    if(await bridge.connect()){
      try{feature.resetRun();resetBackendUI();await bridge.start(idea);return;}catch(error){bridge.active=false;addRunEvidence("error","新版后端启动失败",error.message,"连接桥");showToast("新版后端不可用，已切换兼容模式",true);}
    }
    const configuredBase=String(loadSettings().apiBaseUrl||"");
    if(/\.up\.railway\.app/i.test(configuredBase)){
      const detail=bridge.lastConnectError||"无法完成 Skills 能力校验";
      addRunEvidence("error","云端引擎连接失败",detail+"；未进入旧版直连模式，避免请求不存在的 /chat/completions 接口","连接桥");
      showToast("云端引擎连接失败："+detail,true);
      return;
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
    try{const evidence=await jsonFetch("/api/v1/evidence/"+encodeURIComponent(bridge.workflowId));feature.downloadJSON(evidence,bridge.workflowId+"-server-evidence.json");showToast("已导出后端真实运行证据");}catch(error){localExport();}
  };
  document.addEventListener("DOMContentLoaded",async function(){await bridge.connect();updateBackendBadge();});
})();

