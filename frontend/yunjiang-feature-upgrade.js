/* 云匠 v10 功能增强层 */
(function(){
  const runtimeScript=document.currentScript;
  if(runtimeScript&&!document.getElementById('yj-page-scroll-style')){
    const pageScrollStyle=document.createElement('link');
    pageScrollStyle.id='yj-page-scroll-style';
    pageScrollStyle.rel='stylesheet';
pageScrollStyle.href=new URL('yunjiang-page-scroll.css?v=1.1.4',runtimeScript.src).href;
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
    clearBackendSession:()=>{try{const session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');if(!session)return;session.backendWorkflowId='';session.lastBackendEventId=0;session.checkpoint=0;session.savedAt=new Date().toISOString();localStorage.setItem(SESSION_KEY,JSON.stringify(session))}catch(error){localStorage.removeItem(SESSION_KEY)}},
    downloadJSON:downloadJSON
  };
  window.clearActiveSession=function(){localStorage.removeItem(SESSION_KEY);showToast('当前续存进度已清除')};
  function installLaunchpad(){let mount=document.getElementById('leftReviewLaunchpadMount');if(!mount){const panel=document.querySelector('.left-panel.sidebar-left,.left-panel');if(panel){mount=document.createElement('div');mount.id='leftReviewLaunchpadMount';panel.appendChild(mount)}}if(mount&&!document.getElementById('reviewLaunchpad'))mount.innerHTML='<div class="review-launchpad review-launchpad-left" id="reviewLaunchpad"><div><h3>评审快速入口</h3><p>载入完整示例，快速复核角色、集纲与剧本。</p><div class="scene-presets"><span><button class="scene-preset" onclick="applyScenePreset(\'heritage\')">🏛 非遗</button> <button class="example-link" onclick="loadSceneExample(\'heritage\')">示例</button></span><span><button class="scene-preset" onclick="applyScenePreset(\'male\')">⚡ 男频</button> <button class="example-link" onclick="loadSceneExample(\'male\')">示例</button></span><span><button class="scene-preset" onclick="applyScenePreset(\'campus\')">💗 甜宠</button> <button class="example-link" onclick="loadSceneExample(\'campus\')">示例</button></span></div></div><button class="quick-demo-btn" onclick="startQuickDemo()">▶ 60秒体验</button><button class="cancel-creation-btn" id="cancelCreationBtn" onclick="cancelCurrentCreation()">■ 取消当前创作</button></div>';updateCancelCreationButton()}
  window.updateCancelCreationButton=function(){const btn=document.getElementById('cancelCreationBtn');if(!btn)return;const hasDraft=!!(window.YJBackendBridge?.active||isCreating||document.body.classList.contains('engine-running')||document.getElementById('ideaInput')?.value.trim()||Object.keys(generatedResults||{}).length);btn.disabled=!hasDraft;btn.classList.toggle('is-active',hasDraft);btn.textContent=hasDraft?'■ 取消 / 清除当前创作':'✓ 当前工作台为空'};
  function askCancelDisposition(){return new Promise(resolve=>{document.getElementById('yj-cancel-choice')?.remove();const overlay=document.createElement('div');overlay.id='yj-cancel-choice';overlay.className='yj-cancel-choice';overlay.innerHTML='<div class="yj-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="yj-cancel-title"><div class="yj-cancel-mark">■</div><h3 id="yj-cancel-title">取消当前创作</h3><p>是否把当前已经生成的内容保存到“我的项目”？无论选择哪种方式，当前工作台都会恢复为空白。</p><div class="yj-cancel-summary"><span>当前进度</span><b>'+Math.max(0,stepsCompleted||0)+' / 17</b><span>已生成内容</span><b>'+Object.keys(generatedResults||{}).length+' 项</b></div><div class="yj-cancel-actions"><button data-choice="back">继续创作</button><button class="danger" data-choice="discard">不保存并清除</button><button class="primary" data-choice="save">保存到我的项目</button></div></div>';document.body.appendChild(overlay);overlay.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{const choice=btn.dataset.choice;overlay.remove();resolve(choice)}));overlay.addEventListener('click',event=>{if(event.target===overlay){overlay.remove();resolve('back')}});});}
  function saveDraftToProjects(){const input=document.getElementById('ideaInput'),idea=input?.value.trim()||'';const results=JSON.parse(JSON.stringify(generatedResults||{}));if(!idea&&!Object.keys(results).length)return false;const record={id:'YJ-PROJECT-'+Date.now().toString(36).toUpperCase(),title:idea?(idea.slice(0,30)+(idea.length>30?'...':'')):'未命名创作',time:new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),savedAt:new Date().toISOString(),status:stepsCompleted>=17?'已完成':'创作中止 · 可继续编辑',episodes:loadSettings?.().episodeCount||0,wordCount:Object.values(results).reduce((sum,text)=>sum+String(text||'').replace(/\s/g,'').length,0),completedSteps:stepsCompleted||0,idea,scene:input?.dataset.scene||'',stylePack:activeStylePack,results,agentRun:JSON.parse(JSON.stringify(run||{}))};if(typeof saveHistoryRecord==='function')saveHistoryRecord(record);else{const records=JSON.parse(localStorage.getItem('dramaHistory')||'[]');records.unshift(record);localStorage.setItem('dramaHistory',JSON.stringify(records.slice(0,50)))}return true;}
  function resetWorkspaceToBlank(){localStorage.removeItem(SESSION_KEY);localStorage.removeItem('yunjiang_runtime_events_v1');localStorage.removeItem(LOG_KEY);run={id:'',startedAt:'',events:[],experts:[],checks:0,outputs:0};renderEvidence();generatedResults={};stepsCompleted=0;currentStep=0;isCreating=false;pauseRequested=false;resumeRequested=false;stepWaiting=false;currentWaitingStep=0;window.currentHistoryIndex=null;const input=document.getElementById('ideaInput');if(input){input.value='';delete input.dataset.scene;}document.getElementById('outputContainer')?.replaceChildren();document.getElementById('backend-live-activity')?.remove();const welcome=document.getElementById('welcomeScreen');if(welcome)welcome.style.display='';document.body.classList.remove('engine-running','engine-paused','awaiting-human','core-demo-mode');document.querySelectorAll('[data-expert]').forEach(el=>{el.classList.remove('completed','done','active','working');delete el.dataset.runtimeState;el.querySelector('.backend-skill-runtime')?.remove();});document.querySelectorAll('.step-item').forEach(el=>{el.classList.remove('done','active');const state=el.querySelector('.step-status');if(state)state.textContent='待开始'});document.querySelectorAll('.step-expert-item').forEach(el=>{el.classList.remove('is-working','is-done');const state=el.querySelector('.expert-state');if(state)state.textContent='已就位'});const status=document.getElementById('engineStatusValue');if(status)status.textContent='就绪';const task=document.getElementById('statusTaskInfo');if(task)task.textContent='';const btn=document.getElementById('generateBtn');if(btn){btn.disabled=false;btn.innerHTML='<span>开始创作</span><span>▶</span>';btn.onclick=startCreation;}updateBroadcastNodes?.();updateExpertGroupProgress?.();window.updateBackendBadge?.();window.refreshAgentCenter?.();updateCancelCreationButton();}
  window.clearCreationCache=function(){resetWorkspaceToBlank();showToast('创作缓存已清除，工作台已恢复空白');};
  window.cancelCurrentCreation=async function(){const hasDraft=!!(window.YJBackendBridge?.active||isCreating||document.body.classList.contains('engine-running')||document.getElementById('ideaInput')?.value.trim()||Object.keys(generatedResults||{}).length);if(!hasDraft){showToast('当前工作台已经是空白状态');return}const choice=await askCancelDisposition();if(choice==='back')return;const bridge=window.YJBackendBridge,workflowId=bridge?.workflowId;let backendCanceled=false;if(bridge?.active&&workflowId&&bridge.base){try{const response=await fetch(bridge.base+'/api/v1/cancel/'+encodeURIComponent(workflowId),{method:'POST'});backendCanceled=response.ok}catch(error){addRunEvidence?.('error','后端取消请求失败',error.message,'会话管理器')}}if(stepResolve){const resolve=stepResolve;stepResolve=null;resolve('cancelled')}if(bridge){bridge.active=false;bridge.workflowId='';bridge.outputs={};bridge.checkpoint=null;if(bridge.cancelController){bridge.cancelController.abort();bridge.cancelController=null}bridge.consuming=false}const saved=choice==='save'&&saveDraftToProjects();addRunEvidence?.('checkpoint','用户取消当前创作',(backendCanceled?'后端工作流已停止；':'前端任务已停止；')+(saved?'当前内容已保存到我的项目':'当前内容未保存并已清除'),'会话管理器');resetWorkspaceToBlank();showToast(saved?'已保存到我的项目，工作台已清空':'当前创作已取消并彻底清除');};
  function askPausedAction(){return new Promise(resolve=>{document.getElementById('yj-pause-choice')?.remove();const overlay=document.createElement('div');overlay.id='yj-pause-choice';overlay.className='yj-cancel-choice';overlay.innerHTML='<div class="yj-cancel-dialog yj-pause-dialog" role="dialog" aria-modal="true"><div class="yj-cancel-mark">Ⅱ</div><h3>创作已暂停</h3><p>选择继续接收专家执行结果，或者取消当前创作并处理已经生成的内容。</p><div class="yj-cancel-actions"><button class="danger" data-choice="cancel">取消创作并清空</button><button class="primary" data-choice="resume">继续创作</button></div></div>';document.body.appendChild(overlay);overlay.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{const choice=btn.dataset.choice;overlay.remove();resolve(choice)}));overlay.addEventListener('click',event=>{if(event.target===overlay){overlay.remove();resolve('stay')}});});}
  const baseTogglePauseResume=window.togglePauseResume;
  window.togglePauseResume=async function(){if(!isCreating)return;if(!pauseRequested){baseTogglePauseResume?.();document.body.classList.add('engine-paused');const bridge=window.YJBackendBridge;if(bridge?.cancelController)bridge.cancelController.abort();const btn=document.getElementById('generateBtn');if(btn)btn.innerHTML='<span>已暂停 · 点击选择</span><span>Ⅱ</span>';const status=document.getElementById('engineStatusValue');if(status)status.textContent='已暂停';renderBackendActivity?.({state:'paused',title:'创作流程已暂停',detail:'再次点击暂停按钮，可选择继续创作或取消并清空工作台',progress:Math.min(17,(bridge?.completedExperts||0)+1)});return;}const choice=await askPausedAction();if(choice==='resume'){baseTogglePauseResume?.();document.body.classList.remove('engine-paused');const status=document.getElementById('engineStatusValue');if(status)status.textContent='执行中';const bridge=window.YJBackendBridge;if(bridge?.active){const resumeStream=()=>{if(!bridge.active)return;if(!bridge.consuming)bridge.consume?.();else setTimeout(resumeStream,60)};resumeStream();}showToast('已继续创作');}else if(choice==='cancel'){await window.cancelCurrentCreation();}};
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
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const feature=window.YJFeatureRuntime||{
    getStylePack:()=>localStorage.getItem("yunjiang_style_pack_v1")||"cinematic",
    resetRun:()=>{},setRunIdentity:()=>{},saveSession:()=>{},clearBackendSession:()=>{},downloadJSON:()=>{}
  };
  const EXPERT_STEP={"§10":13,"§0":1,"§2":2,"§8":3,"§1":4,"§3":6,"§4":5,"§5":7,"§12":16,"§11":11,"§6":9,"§7":10,"§9":12,"§13":8,"§14":14,"§16":17,"§15":15};
  const CHECKPOINTS={
    "§3":{step:4,source:"§1",next:"§11",title:"角色设定等待你的决策",message:"角色铸造师已经完成角色设定。确认、修改或直接编辑后，后端才会继续进入剧情结构与分集大纲。"},
    // §12 是检查点协议产物，§5 是用户实际审阅的分集大纲；二者必须分别保存。
    "§11":{step:7,source:"§12",displaySource:"§5",next:"§7",title:"剧情大纲等待你的决策",message:"结构、分集目标和集纲审核已经完成。确认故事走向后，后端才会继续生成场景与格式化分集剧本。"},
    "§7":{step:7,source:"§6",next:null,title:"分集剧本等待你的决策",message:"场景设计与格式化剧本已经完成。确认后将进入质量审计、返工和最终签发流程。"}
  };
  const WORKFLOW_ORDER=["§10","§0","§2","§8","§1","§3","§4","§5","§12","§11","§6","§7","§9","§13","§14","§16","§15"];
  function nextPlannedCheckpoint(expertId){const current=WORKFLOW_ORDER.indexOf(expertId);return ["§3","§11","§7"].find(id=>WORKFLOW_ORDER.indexOf(id)>current)||null;}
  const SOURCE_STEP={"§1":4,"§5":7,"§6":7};
  const EXPERT_NAME={"§10":"mission_commander","§0":"soul_catcher","§2":"compliance_guard","§8":"project_configurator","§1":"character_forger","§3":"structure_architect","§4":"dialogue_master","§5":"episode_writer","§12":"episode_outline_reviewer","§11":"scene_craftsman","§6":"format_craftsman","§7":"quality_auditor","§9":"revision_editor","§13":"visual_director","§14":"business_strategist","§16":"script_reviewer","§15":"quality_director"};
  const bridge={available:false,active:false,workflowId:"",lastEventId:0,outputs:{},checkpoint:null,base:"",consuming:false,stylePacks:[],lastConnectError:"",connectWarning:"",capabilitiesVerified:false,connectPromise:null,completedExpertIds:new Set()};
  window.YJBackendBridge=bridge;

  function apiBase(){
    const normalize=value=>{let base=String(value||"").trim().replace(/\/+$/,"");if(!/^https?:\/\//i.test(base))return "";base=base.replace(/\/api\/v1\/(?:skills|style-packs|create|health)$/i,"").replace(/\/api\/v1$/i,"").replace(/\/v1$/i,"").replace(/\/health$/i,"");return base;};
    const hostname=String(window.location.hostname||"").toLowerCase();
    const isGitHubPages=hostname==="github.io"||hostname.endsWith(".github.io");
    const hosted=/^https?:$/.test(window.location.protocol)&&!isGitHubPages?window.location.origin:"";
    let resolved="";try{resolved=typeof window.YJResolveEngineApiBase==="function"?window.YJResolveEngineApiBase():"";}catch(error){}
    let configured="";try{configured=typeof loadSettings==="function"?loadSettings().apiBaseUrl:"";}catch(error){}
    const candidates=[window.YJ_ENGINE_API_BASE,window.YJ_API_BASE,resolved,configured,hosted,"https://reasonable-magic-production-7faf.up.railway.app"];
    return candidates.map(normalize).find(base=>{if(!base)return false;try{return !/github\.io$/i.test(new URL(base).hostname)}catch(error){return false}})||"https://reasonable-magic-production-7faf.up.railway.app";
  }
  async function jsonFetch(path,options){
    const response=await fetch(bridge.base+path,{headers:{"Content-Type":"application/json",...(options&&options.headers||{})},...options});
    if(!response.ok){const error=new Error((await response.text().catch(()=>""))||("HTTP "+response.status));error.status=response.status;error.path=path;throw error;}
    return response.json();
  }
  async function probeEndpoint(path,attempts=1){let lastError=null;for(let attempt=0;attempt<attempts;attempt++){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);try{const response=await fetch(bridge.base+path,{cache:"no-store",headers:{Accept:"application/json"},signal:controller.signal});clearTimeout(timer);if(response.ok)return response;lastError=new Error(path+" HTTP "+response.status);}catch(error){clearTimeout(timer);lastError=error;}if(attempt<attempts-1)await new Promise(resolve=>setTimeout(resolve,350*(attempt+1)));}throw lastError||new Error(path+" 请求失败");}
  bridge.connect=function(){
    if(bridge.connectPromise)return bridge.connectPromise;
    const pending=(async()=>{
      bridge.base=apiBase();bridge.lastConnectError="";
      if(!bridge.base){bridge.available=false;bridge.lastConnectError="API 地址解析失败：没有找到有效的 HTTP 服务地址";updateBackendBadge();return false;}
      try{
        const healthResponse=await probeEndpoint("/health",2),health=await healthResponse.json();bridge.serverVersion=health.version||"unknown";bridge.checkpointProtocol=health.checkpoint_protocol||"legacy";
        bridge.available=true;bridge.capabilitiesVerified=false;bridge.connectWarning="";
        // Skills 与风格包属于增强能力；健康服务可用时不阻断工作流启动。
        try{const skills=await probeEndpoint("/api/v1/skills",2);const data=await skills.json();const count=Array.isArray(data)?data.length:Number(data?.count||Object.keys(data?.skills||{}).length);bridge.capabilitiesVerified=count>0;if(!bridge.capabilitiesVerified)bridge.connectWarning="Skills 清单为空，已按健康服务继续连接";}catch(error){bridge.connectWarning="Skills 清单暂时不可用（"+(error.message||"网络异常")+"），已按健康服务继续连接";}
        try{const packsResponse=await probeEndpoint("/api/v1/style-packs",1);const data=await packsResponse.json();bridge.stylePacks=data.packs||[];document.querySelectorAll(".style-pack-btn").forEach(button=>{const pack=bridge.stylePacks.find(item=>item.id===button.dataset.pack);if(pack){button.title=pack.description+"｜v"+pack.version;button.dataset.version=pack.version;}});const activePackId=feature.getStylePack();if(bridge.stylePacks.length&&!bridge.stylePacks.some(item=>item.id===activePackId))window.selectStylePack?.("cinematic",true);}catch(error){bridge.connectWarning=bridge.connectWarning||"风格包清单暂时不可用，使用前端内置风格包";}
        bridge.lastConnectError="";updateBackendBadge();return true;
      }catch(error){bridge.available=false;bridge.lastConnectError="连接 "+bridge.base+" 失败："+(error.name==="AbortError"?"请求超时":error.message||"网络异常");updateBackendBadge();return false;}
    })();
    bridge.connectPromise=pending;
    pending.finally(()=>{if(bridge.connectPromise===pending)bridge.connectPromise=null;});
    return pending;
  };
  function updateBackendBadge(){
    let badge=document.getElementById("backendLinkBadge");
    const strip=document.getElementById("capabilityStrip");
    if(strip&&!badge){badge=document.createElement("span");badge.id="backendLinkBadge";badge.className="layer-badge";strip.appendChild(badge);}
    if(badge){badge.classList.toggle("on",bridge.available);badge.title=(bridge.connectWarning?bridge.connectWarning+"｜":"")+"前端 1.3.10｜后端 "+(bridge.serverVersion||"未识别")+"｜断点协议 "+(bridge.checkpointProtocol||"legacy");badge.textContent=bridge.available?(bridge.active?"后端执行中":bridge.capabilitiesVerified?"后端已连接":"后端已连接 · 能力同步中"):"本地兼容模式";}
  }
  function resetBackendUI(){
    isCreating=true;pauseRequested=false;resumeRequested=false;stepsCompleted=0;currentStep=0;generatedResults={};
    document.body.classList.add("engine-running");document.body.classList.remove("engine-paused","awaiting-human");
    const welcome=document.getElementById("welcomeScreen");if(welcome)welcome.style.display="none";const output=document.getElementById("outputContainer");if(output)output.innerHTML="";bridge.completedExpertIds=new Set();bridge.completedExperts=0;
    document.querySelectorAll("[data-expert]").forEach(el=>{el.classList.remove("completed","done","active","working");delete el.dataset.runtimeState;el.querySelector('.backend-skill-runtime')?.remove();});
    document.querySelectorAll('.step-item').forEach((item,index)=>setPhaseStatus(index+1,'ready'));
    const btn=document.getElementById("generateBtn");btn.disabled=false;btn.innerHTML="<span>后端创作中...</span><span>⏳</span>";btn.onclick=togglePauseResume;
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="连接后端";
    renderBackendActivity({state:"connecting",title:"正在连接云匠 Agent 引擎",detail:"建立实时事件通道，准备接收专家执行步骤",progress:0});
  }
  function expertLabel(id){return ({"§10":"实战指挥","§0":"灵魂捕手","§2":"合规守门员","§8":"项目配置师","§1":"角色铸造师","§3":"结构建筑师","§4":"对白大师","§5":"分集编剧","§12":"集纲审核","§11":"场景工匠","§6":"格式工匠","§7":"质量审计","§9":"改稿编辑","§13":"视觉导演","§14":"商业操盘","§16":"剧本审核","§15":"品控总监"})[id]||id;}
  function phaseForExpertElement(element){const group=element?.closest?.('.expert-group');if(!group)return 0;return Array.from(document.querySelectorAll('.expert-group')).indexOf(group)+1;}
  function setPhaseStatus(phase,state){
    if(!phase)return;const item=document.querySelector('.step-item[data-phase="'+phase+'"]');if(!item)return;
    item.classList.toggle('active',state==='working');item.classList.toggle('done',state==='done');
    const status=item.querySelector('.step-status');if(status){let label=status.querySelector('.step-agent-tag');if(!label){label=document.createElement('span');label.className='step-agent-tag';label.textContent='子AGENT';}status.replaceChildren(document.createTextNode(state==='working'?'进行中 ':state==='done'?(phase===6?'审核完成 ':'已完成 '):(phase===6?'待审核 ':'待开始 ')),label);}
    if(state==='working')window.autoExpandStepAccordion?.(phase);
  }
  function syncRuntimePanels(event,state){
    const expertName=EXPERT_NAME[event.expert_id];if(!expertName)return;
    const element=document.querySelector('[data-expert="'+expertName+'"]');if(!element)return;
    const phase=phaseForExpertElement(element),group=element.closest('.expert-group');
    element.classList.remove('active','working','done','completed');element.classList.add(state==='working'?'working':'done',state==='working'?'active':'completed');element.dataset.runtimeState=state;
    let runtimeSkill=element.querySelector('.backend-skill-runtime');
    if(event.skill){if(!runtimeSkill){runtimeSkill=document.createElement('div');runtimeSkill.className='backend-skill-runtime';element.appendChild(runtimeSkill);}const checks=Array.isArray(event.skill.checks)?event.skill.checks.slice(0,2).join(' · '):'';runtimeSkill.textContent='SKILL · '+(event.skill.name||event.skill.id||'运行能力')+' v'+(event.skill.version||'1.0.0')+(checks?'｜'+checks:'');}
    if(state==='working'){document.querySelectorAll('.step-item.active').forEach(node=>{if(node!==document.querySelector('.step-item[data-phase="'+phase+'"]'))node.classList.remove('active')});setPhaseStatus(phase,'working');window.focusExpertGroupByExpert?.(expertName);}
    window.updateExpertGroupProgress?.();if(state==='done'&&group&&!group.querySelector('.expert-item:not(.done):not(.completed)'))setPhaseStatus(phase,'done');window.refreshAgentCenter?.();
  }
  function renderBackendActivity(options){
    const output=document.getElementById("outputContainer");if(!output)return;
    let panel=document.getElementById("backend-live-activity");
    if(!panel){panel=document.createElement("section");panel.id="backend-live-activity";panel.className="backend-live-activity";output.parentNode.insertBefore(panel,output);}
    const state=options?.state||"working",progress=Math.max(0,Math.min(17,Number(options?.progress)||0));
    panel.className="backend-live-activity is-"+state;
    panel.innerHTML='<div class="backend-live-icon">'+(state==="done"?"✓":state==="error"?"!":"✦")+'</div><div class="backend-live-copy"><div class="backend-live-eyebrow">当前执行步骤 <span>'+progress+' / 17</span></div><strong>'+esc(options?.title||"云匠引擎正在执行")+'</strong><p>'+esc(options?.detail||"正在等待后端返回实时事件")+'</p><div class="backend-live-track"><i style="width:'+Math.round(progress/17*100)+'%"></i></div></div><span class="backend-live-state">'+(state==="done"?"已完成":state==="error"?"异常":"实时运行中")+'</span>';
  }
  function parseArtifactJSON(content){
    const raw=String(content||"").trim();
    const fenced=raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    try{return JSON.parse(fenced?fenced[1]:raw)}catch(error){return null;}
  }
  function artifactDisplayContent(expertId,content){
    const data=parseArtifactJSON(content);if(!data)return content;
    if(expertId==="§5"&&Array.isArray(data.episodes)){
      const labels={goal:"本集目标",conflict:"核心冲突",choice:"关键选择",cost:"付出代价",new_information:"新增信息",result:"本集结果",new_hook:"集尾钩子",next_expectation:"下集期待"};
      return "# 分集故事大纲\n\n"+data.episodes.map((episode,index)=>{
        const id=episode.episode_id??episode.episode??(index+1);
        const rows=Object.keys(labels).filter(key=>episode[key]!==undefined&&episode[key]!==null&&String(episode[key]).trim()).map(key=>"- **"+labels[key]+"：** "+String(episode[key]));
        if(Array.isArray(episode.payoffs)&&episode.payoffs.length)rows.push("- **伏笔回收：** "+episode.payoffs.join("；"));
        return "## 第 "+id+" 集\n\n"+rows.join("\n");
      }).join("\n\n");
    }
    if(expertId==="§12"&&Array.isArray(data.issues)){
      const header="# 集纲审核报告\n\n"+(data.summary||"已完成集纲审核")+(data.score!==undefined?"\n\n**评分：** "+data.score:"");
      if(!data.issues.length)return header+"\n\n- 未发现需要阻断的问题。";
      return header+"\n\n"+data.issues.map((issue,index)=>"## 问题 "+(index+1)+(issue.episode_id!==undefined?" · 第 "+issue.episode_id+" 集":"")+"\n\n- **诊断：** "+(issue.diagnosis||"未提供")+"\n- **修改建议：** "+(issue.repair||"未提供")).join("\n\n");
    }
    if(expertId==="§11"&&Array.isArray(data.scenes)){
      const senseLabels={visual:"视觉",audio:"听觉",smell:"嗅觉",touch:"触觉",taste:"味觉"};
      const scenes=data.scenes.map((scene,index)=>{
        const sceneId=scene.scene_id||("S"+String(index+1).padStart(2,"0"));
        const title=scene.name||scene.location||"未命名场景";
        const timeSpace=[scene.space_type,scene.location,scene.time_of_day].filter(Boolean).join(" · ");
        const rows=[];
        if(timeSpace)rows.push("- **时空：** "+timeSpace);
        if(scene.atmosphere)rows.push("- **氛围：** "+scene.atmosphere);
        if(scene.narrative_function)rows.push("- **叙事作用：** "+scene.narrative_function);
        if(scene.emotional_mapping)rows.push("- **情绪映射：** "+scene.emotional_mapping);
        const senses=scene.senses&&typeof scene.senses==="object"?Object.entries(scene.senses).filter(([,value])=>String(value||"").trim()).map(([key,value])=>(senseLabels[key]||key)+"："+value):[];
        if(senses.length)rows.push("- **五感设计：** "+senses.join("；"));
        if(scene.production_notes)rows.push("- **拍摄提示：** "+scene.production_notes);
        if(scene.transition_out)rows.push("- **转场：** "+scene.transition_out);
        return "## "+sceneId+" · "+title+"\n\n"+(rows.join("\n")||"- 场景细节待补充");
      }).join("\n\n");
      const templates=Array.isArray(data.environment_templates)&&data.environment_templates.length?"\n\n## 环境描写参考\n\n"+data.environment_templates.map(item=>"- "+item).join("\n"):"";
      return "# 场景设计方案\n\n"+(scenes||"暂未生成有效场景")+templates;
    }
    if(expertId==="§16"&&Array.isArray(data.issues)){
      const decisions={pass:"通过",revise:"修改后通过",reject:"不通过"};
      const decision=decisions[String(data.decision||"").toLowerCase()]||data.decision||"待判定";
      const strengths=Array.isArray(data.strengths)&&data.strengths.length?"\n\n## 已确认的优点\n\n"+data.strengths.map(item=>"- "+item).join("\n"):"";
      const issues=data.issues.length?"\n\n## 待修复问题\n\n"+data.issues.map((issue,index)=>{
        const node=issue.node_id?" · "+issue.node_id:"";
        return "### 问题 "+(index+1)+node+"\n\n- **文本证据：** "+(issue.evidence||"未提供")+"\n- **问题诊断：** "+(issue.diagnosis||"未提供")+"\n- **修改方案：** "+(issue.repair||"未提供");
      }).join("\n\n"):"\n\n## 审核结果\n\n- 未发现需要阻断的问题。";
      return "# 剧本审核报告\n\n- **综合评分：** "+(data.score??"未评分")+"\n- **审核结论：** "+decision+strengths+issues;
    }
    if(expertId==="§3"&&(Array.isArray(data.beat_table)||Array.isArray(data.arc_tracking))){
      const beats=(data.beat_table||[]).map((beat,index)=>"- **转折点 "+(beat.beat_num??index+1)+"：** "+(beat.description||beat.content||JSON.stringify(beat))).join("\n");
      const arcs=(data.arc_tracking||[]).map(item=>"- "+(item.raw||item.description||JSON.stringify(item))).join("\n");
      return "# 叙事结构与转折点\n\n## 全剧转折点\n\n"+(beats||"暂无转折点")+"\n\n## 人物弧光\n\n"+(arcs||"暂无弧光记录");
    }
    return content;
  }
  function renderBackendOutput(expertId,content){
    const stepNum=SOURCE_STEP[expertId]||EXPERT_STEP[expertId];if(!stepNum)return;
    const safe=sanitizeLLMOutput(content||"");bridge.outputs[expertId]=safe;generatedResults[stepNum]=safe;
    let card=document.getElementById("step-card-"+stepNum);
    const prompt=stepPrompts[stepNum]||{};const step=stepData[stepNum]||{};
    if(!card){card=document.createElement("div");card.className="output-card";card.id="step-card-"+stepNum;card.innerHTML='<div class="output-header"><div class="output-icon">'+(step.icon||"🔧")+'</div><div><div class="output-title">'+(step.title||expertLabel(expertId))+'</div><div class="output-meta">'+expertLabel(expertId)+' · 后端真实产物</div></div></div><div class="output-body"><div id="stream-content-'+stepNum+'"></div></div>';document.getElementById("outputContainer").appendChild(card);}
    const target=document.getElementById("stream-content-"+stepNum);if(target)target.innerHTML=renderMarkdown(artifactDisplayContent(expertId,safe));
    syncRuntimePanels({expert_id:expertId},"done");
    bridge.completedExpertIds.add(expertId);bridge.completedExperts=Math.min(17,bridge.completedExpertIds.size);
    renderBackendActivity({state:"done",title:expertLabel(expertId)+"已完成当前步骤",detail:"产物已写入画布，正在等待下一位专家接续执行",progress:bridge.completedExperts});
    stepsCompleted=Math.max(stepsCompleted,stepNum);currentStep=stepNum;updateBroadcastNodes();updateExpertGroupProgress();feature.saveSession();
  }
  function markWorking(event){
    const id=event.expert_id,step=EXPERT_STEP[id];currentStep=step||currentStep;
    document.querySelectorAll("[data-expert]").forEach(el=>el.classList.remove("active","working"));
    syncRuntimePanels(event,"working");
    const task=document.getElementById("statusTaskInfo");if(task)task.textContent="· "+expertLabel(id)+"正在执行真实后端任务";
    const stepDataItem=window.stepData?.[step]||{};
    renderBackendActivity({state:"working",title:expertLabel(id)+"正在执行"+(stepDataItem.title?" · "+stepDataItem.title:""),detail:event.task||event.judgement||event.message||"正在分析输入、执行专业判断并生成中间结果",progress:Math.min(17,(bridge.completedExperts||0)+1)});
    addRunEvidence("working","专家开始执行",event.task||expertLabel(id),expertLabel(id));
  }
  function showBackendCheckpoint(stopExpert,event={}){
    const isGatePause=!!event.reason&&!String(event.reason).startsWith("human_checkpoint:");
    const rejectedOutput=isGatePause&&!(event.completed_experts||[]).includes(stopExpert);
    const plannedCheckpoint=!isGatePause&&CHECKPOINTS[stopExpert];
    const cp=plannedCheckpoint||{step:EXPERT_STEP[stopExpert]||Math.max(1,currentStep),source:stopExpert,displaySource:stopExpert,next:nextPlannedCheckpoint(stopExpert),retry:rejectedOutput,title:stopExpert==="§15"?"终审报告等待你的签发":isGatePause?expertLabel(stopExpert)+"质量门禁待处理":expertLabel(stopExpert)+"需要人工确认",message:event.reason||(rejectedOutput?"质量门禁暂停了工作流。确认后将重新执行当前专家，再继续运行后续专家。":"专家产物已经保留，确认后工作流将继续。")} ;bridge.checkpoint={...cp,displaySource:cp.displaySource||cp.source,stopExpert};
    const displaySource=bridge.checkpoint.displaySource,sourceText=bridge.outputs[displaySource]||generatedResults[cp.step]||"";if(sourceText)renderBackendOutput(displaySource,sourceText);
    document.getElementById("action-btns-"+cp.step)?.remove();
    const panel=document.createElement("div");panel.className="step-action-btns checkpoint-dialog";panel.id="action-btns-"+cp.step;
    panel.innerHTML='<div class="checkpoint-bubble"><div class="checkpoint-title">'+cp.title+'</div><div class="checkpoint-message">'+cp.message+'</div><div class="checkpoint-actions"><button class="step-btn step-btn-confirm" onclick="confirmCurrentStep('+cp.step+')">'+(cp.retry?'确认并重试当前步骤':'确认并继续')+'</button>'+(cp.retry?'':'<button class="step-btn step-btn-revise" onclick="showReviseInput('+cp.step+')">提出修改意见</button><button class="step-btn step-btn-edit" onclick="showEditArea('+cp.step+')">直接编辑</button>')+'</div></div>';
    document.getElementById("outputContainer").appendChild(panel);currentWaitingStep=cp.step;stepWaiting=true;document.body.classList.add("awaiting-human");
    const status=document.getElementById("engineStatusValue");if(status)status.textContent="等待决策";
    addRunEvidence("checkpoint",cp.title,"后端工作流已真实暂停；确认前不会运行下游专家",expertLabel(cp.source));scrollToPageBottom();feature.saveSession();
  }
  bridge.handleEvent=function(event){
    try{const key="yunjiang_runtime_events_v1",events=JSON.parse(localStorage.getItem(key)||"[]");events.push({...event,time:event.time||event.timestamp||new Date().toISOString(),title:event.title||event.type});localStorage.setItem(key,JSON.stringify(events.slice(-200)))}catch(error){}
    if(event.event_id)bridge.lastEventId=Math.max(bridge.lastEventId,event.event_id);
    if(event.type==="expert_start")markWorking(event);
    else if(event.type==="expert_complete"){
      renderBackendOutput(event.expert_id,event.output||event.output_preview||"");syncRuntimePanels(event,"done");
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
    else if(event.type==="checkpoint"){if(Array.isArray(event.completed_experts)){bridge.completedExpertIds=new Set(event.completed_experts);bridge.completedExperts=bridge.completedExpertIds.size;}showBackendCheckpoint(event.expert_id,event);}
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
    }catch(error){if(error.name!=="AbortError"){if(isMissingWorkflow(error))expireWorkflowSession("事件流中的工作流已失效");else{addRunEvidence("error","SSE连接中断",error.message,"事件桥");showToast("后端事件流中断，可从断点恢复",true);}}}finally{bridge.consuming=false;bridge.cancelController=null;updateBackendBadge();updateCancelCreationButton?.();}
  };
  bridge.restartConsume=function(){
    bridge.reconnectRequested=true;if(bridge.cancelController)bridge.cancelController.abort();
    const reconnect=()=>{if(!bridge.active){bridge.reconnectRequested=false;return;}if(bridge.consuming){bridge.reconnectTimer=setTimeout(reconnect,80);return;}bridge.reconnectRequested=false;bridge.consume();};
    clearTimeout(bridge.reconnectTimer);bridge.reconnectTimer=setTimeout(reconnect,0);
  };
  bridge.armResumeWatchdog=function(cp){
    clearTimeout(bridge.resumeWatchdog);const workflowId=bridge.workflowId;
    bridge.resumeWatchdog=setTimeout(async()=>{if(!bridge.active||bridge.workflowId!==workflowId)return;try{const progress=await jsonFetch("/api/v1/progress/"+encodeURIComponent(workflowId));if(progress.status==="paused"&&progress.current_expert===cp.stopExpert){addRunEvidence("check","恢复看门狗发现工作流仍停在原断点","自动补发恢复请求；断点 "+cp.stopExpert,"会话管理器");await jsonFetch("/api/v1/resume/"+encodeURIComponent(workflowId),{method:"POST",body:JSON.stringify({stop_at:cp.next})});bridge.restartConsume();}else if(progress.status==="running"){bridge.restartConsume();}else if(progress.status==="failed"){renderBackendActivity({state:"error",title:"后端恢复失败",detail:"工作流进入 failed 状态，请查看 Agent Run 错误证据",progress:bridge.completedExperts||0});}}catch(error){addRunEvidence("error","恢复看门狗检查失败",error.message,"会话管理器");}},3500);
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
    }catch(error){if(isMissingWorkflow(error))expireWorkflowSession("云端重启后，之前的工作流已失效",false);return false;}
  };
  bridge.start=async function(idea,context={}){
    const settings=loadSettings(),packId=(localStorage.getItem("yunjiang_style_pack_v1")||"cinematic"),packMeta=bridge.stylePacks.find(item=>item.id===packId)||{};const payload={story_direction:idea,drama_type:selectedStyle||null,total_episodes:settings.episodeCount||30,style_pack_id:packId,style_pack_version:packMeta.version||null,stop_at:"§3"};
    if(context.project_id)payload.project_id=context.project_id;
    if(context.config){const config=context.config;payload.drama_type=config.genre||payload.drama_type;payload.total_episodes=config.total_episodes||payload.total_episodes;payload.style_pack_id=config.style_pack_id||payload.style_pack_id;payload.user_materials=[config.platform?'发布平台：'+config.platform:'',config.audience?'目标受众：'+config.audience:'',config.constraints?'制作约束：'+config.constraints:''].filter(Boolean).join('\n');}
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
  window.startCreation=async function(context={}){
    const input=document.getElementById("ideaInput");const idea=String(context.idea||(input&&input.value)||"").trim();if(!idea){showToast("请输入你的短剧想法",true);return;}if(input&&context.idea)input.value=context.idea;
    const healthReady=await bridge.connect();if(!bridge.base)bridge.base=apiBase();
    try{feature.resetRun();resetBackendUI();await bridge.start(idea,context);if(!healthReady)addRunEvidence("check","健康检查未完成但工作流已创建",bridge.base+" 的 /api/v1/create 已成功响应","连接桥");return;}catch(error){bridge.active=false;isCreating=false;document.body.classList.remove("engine-running","engine-paused");const message="工作流创建失败（"+bridge.base+"/api/v1/create）："+(error.message||"网络异常");bridge.lastConnectError=message;addRunEvidence("error","云端工作流创建失败",message,"连接桥");renderBackendActivity({state:"error",title:"云端工作流创建失败",detail:message,progress:0});const status=document.getElementById("engineStatusValue");if(status)status.textContent="连接失败";const btn=document.getElementById("generateBtn");if(btn){btn.disabled=false;btn.innerHTML="<span>重新尝试</span><span>↻</span>";btn.onclick=startCreation;}showToast(message,true);}
    const configuredBase=String(loadSettings().apiBaseUrl||"");
    if(/\.up\.railway\.app/i.test(configuredBase)){
      updateBackendBadge();
      return;
    }
    return fallbackStart.apply(this,arguments);
  };
  const localConfirm=window.confirmCurrentStep;
  function isMissingWorkflow(error){const message=String(error?.message||error||"");return /(?:HTTP\s*404|工作流\s*wf_[^\s]*\s*未找到|workflow[^\n]*not found|事件流连接失败\s+404)/i.test(message);}
  function expireWorkflowSession(reason,notify=true){
    const expiredId=bridge.workflowId;bridge.active=false;bridge.workflowId="";bridge.lastEventId=0;bridge.outputs={};bridge.checkpoint=null;
    if(bridge.cancelController){bridge.cancelController.abort();bridge.cancelController=null;}bridge.consuming=false;isCreating=false;stepWaiting=false;currentWaitingStep=0;
    document.body.classList.remove("engine-running","engine-paused","awaiting-human");document.querySelectorAll(".checkpoint-dialog").forEach(node=>node.remove());
    feature.clearBackendSession();const status=document.getElementById("engineStatusValue");if(status)status.textContent="会话已失效";
    const btn=document.getElementById("generateBtn");if(btn){btn.disabled=false;btn.innerHTML="<span>重新开始创作</span><span>↻</span>";btn.onclick=startCreation;}
    const detail=reason+"。当前画布内容已保留，可先保存到“我的项目”，然后重新开始创作。";
    renderBackendActivity({state:"error",title:"云端工作流已失效",detail,progress:bridge.completedExperts||0});addRunEvidence("error","云端工作流已失效",(expiredId?expiredId+"｜":"")+detail,"会话管理器");
    updateBackendBadge();updateCancelCreationButton?.();if(notify)showToast(detail,true);
  }
  window.confirmCurrentStep=async function(stepNum){
    if(!bridge.active||!bridge.checkpoint||bridge.checkpoint.step!==stepNum)return localConfirm(stepNum);
    if(bridge.confirming)return;bridge.confirming=true;const cp=bridge.checkpoint,confirmButton=document.querySelector("#action-btns-"+stepNum+" .step-btn-confirm");if(confirmButton){confirmButton.disabled=true;confirmButton.textContent=cp.retry?"正在重试...":"正在确认...";}try{
      const displaySource=cp.displaySource||cp.source,displayContent=generatedResults[stepNum]||bridge.outputs[displaySource]||"";
      const payload={expert_id:cp.source,edited_content:cp.retry?null:(displaySource===cp.source?displayContent:null),artifact_expert_id:displaySource!==cp.source?displaySource:null,edited_artifact_content:displaySource!==cp.source?displayContent:null,stop_at:cp.next};addRunEvidence("working","正在提交人工决策","断点 "+cp.stopExpert+"｜确认产物 "+cp.source+(displaySource!==cp.source?"｜展示产物 "+displaySource:"")+"｜协议 "+(bridge.checkpointProtocol||"legacy"),"人在回路");
      try{await jsonFetch("/api/v1/workflow/"+encodeURIComponent(bridge.workflowId)+"/checkpoint-and-resume",{method:"POST",body:JSON.stringify(payload)});}catch(error){if(error.status!==404)throw error;addRunEvidence("check","线上后端尚未支持原子恢复接口","已自动切换兼容协议","会话管理器");await jsonFetch("/api/v1/workflow/"+encodeURIComponent(bridge.workflowId)+"/checkpoint",{method:"POST",body:JSON.stringify(payload)});await jsonFetch("/api/v1/resume/"+encodeURIComponent(bridge.workflowId),{method:"POST",body:JSON.stringify({stop_at:cp.next})});}
      document.getElementById("action-btns-"+stepNum)?.remove();document.body.classList.remove("awaiting-human");stepWaiting=false;currentWaitingStep=0;bridge.checkpoint=null;
      addRunEvidence("checkpoint","人工决策已写回后端","已确认 "+expertLabel(cp.source)+(cp.next?"；下一暂停点 "+cp.next:"；进入终审"),"人在回路");
      renderBackendActivity({state:"working",title:"人工决策已确认，工作流正在继续",detail:"后端已经接收决定，正在启动下一位专家",progress:bridge.completedExperts||0});bridge.restartConsume();bridge.armResumeWatchdog(cp);
    }catch(error){if(isMissingWorkflow(error)){expireWorkflowSession("后端找不到当前工作流，可能刚刚发生了重新部署或重启");return;}showToast("确认写回失败："+error.message,true);addRunEvidence("error","人工决策写回失败",error.message,"人在回路");if(confirmButton){confirmButton.disabled=false;confirmButton.textContent=cp.retry?"确认并重试当前步骤":"确认并继续";}}finally{bridge.confirming=false;}
  };
  const localSubmitRevise=window.submitRevise;
  window.submitRevise=async function(stepNum){
    if(!bridge.active||!bridge.checkpoint||bridge.checkpoint.step!==stepNum)return localSubmitRevise(stepNum);
    const input=document.getElementById("revise-input-"+stepNum),feedback=input&&input.value.trim();if(!feedback){showToast("请输入修改意见",true);return;}
    const cp=bridge.checkpoint,btns=document.getElementById("action-btns-"+stepNum);if(input.closest(".revise-input-area"))input.closest(".revise-input-area").remove();if(btns)btns.innerHTML='<span style="color:#9d526c;font-weight:600">后端专家修改中...</span>';
    try{
      const displaySource=cp.displaySource||cp.source,current=generatedResults[stepNum]||bridge.outputs[displaySource]||"";
      const data=await jsonFetch("/api/v1/step/"+encodeURIComponent(displaySource),{method:"POST",body:JSON.stringify({user_input:"当前产物：\n"+current+"\n\n修改意见：\n"+feedback+"\n\n请输出修改后的完整内容。",context:null})});
      generatedResults[stepNum]=data.content||current;bridge.outputs[displaySource]=generatedResults[stepNum];renderBackendOutput(displaySource,generatedResults[stepNum]);showBackendCheckpoint(cp.stopExpert);addRunEvidence("checkpoint","修改稿已返回检查点",feedback,expertLabel(displaySource));showToast("后端专家修改完成，请重新确认");
    }catch(error){showToast("后端修改失败："+error.message,true);showBackendCheckpoint(cp.stopExpert);}
  };
  const localExport=window.exportRunEvidence;
  window.exportRunEvidence=async function(){
    if(!bridge.workflowId)return localExport();
    try{const evidence=await jsonFetch("/api/v1/evidence/"+encodeURIComponent(bridge.workflowId));feature.downloadJSON(evidence,bridge.workflowId+"-server-evidence.json");showToast("已导出后端真实运行证据");}catch(error){localExport();}
  };
  document.addEventListener("DOMContentLoaded",async function(){await bridge.connect();updateBackendBadge();});
})();

