/**
 * 云匠文化出海制片工作台
 * 文化资产锁定 -> 海外受众与平台策略 -> 风险诊断 -> 本地化改编 -> 双语与发行交付
 * @version 1.0.0
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'yunjiang_global_workbench_v1';
  var state;
  var STAGES = [
    {id:'asset_lock',label:'文化资产锁定',agent:'文化资产守护 Agent',skill:'culture-asset-lock',checks:['文化内核','不可替换符号'],checkpoint:'assets'},
    {id:'market_fit',label:'海外受众分析',agent:'海外受众洞察 Agent',skill:'market-audience-fit',checks:['受众门槛','平台节奏']},
    {id:'risk_scan',label:'跨文化风险扫描',agent:'海外合规 Agent',skill:'cross-culture-risk-scan',checks:['文化禁忌','价值观','平台政策']},
    {id:'localize',label:'剧情本地化改编',agent:'跨文化编剧 Agent',skill:'story-localization',checks:['骨架守恒','理解成本'],checkpoint:'localization'},
    {id:'language',label:'双语对白与字幕',agent:'本地化语言 Agent',skill:'bilingual-dialogue',checks:['语境自然','字幕长度']},
    {id:'distribution',label:'海外发行包装',agent:'发行策略 Agent',skill:'global-distribution-pack',checks:['标题钩子','平台元数据']},
    {id:'supervision',label:'监督复核与交付',agent:'全球化监督 Agent',skill:'globalization-supervision',checks:['文化保真','市场可行','证据完整']}
  ];
  var DEMO = {
    source:{title:'《最后一炉》',type:'非遗原创短剧',summary:'景泰蓝传人林砚为保住祖父留下的老作坊，与投资人顾沉舟达成30天对赌。'},
    market:{region:'东南亚',country:'新加坡 / 马来西亚',language:'English + 简体中文',platform:'YouTube Shorts / TikTok',audience:'18–34岁文化内容与情感短剧观众',episode:'6集 × 90秒'},
    assets:[
      {name:'景泰蓝工艺',kind:'非遗技艺',rule:'名称、核心工序和手工价值不可替换',locked:false,evidence:'KB-HERITAGE-014'},
      {name:'最后一炉',kind:'核心意象',rule:'必须作为人物选择与文化传承的高潮符号',locked:false,evidence:'SCRIPT-BEAT-06'},
      {name:'祖孙传承',kind:'人物关系',rule:'保留代际承诺，避免改写为单纯商业复仇',locked:false,evidence:'CHAR-LIN-02'}
    ],
    risks:[
      {level:'高',area:'理解门槛',issue:'海外观众可能不了解景泰蓝与“点蓝、烧蓝”工序',solution:'用订单危机和视觉化工序建立理解，不采用百科式解释',status:'已处理'},
      {level:'中',area:'价值表达',issue:'“守祖业”可能被理解为拒绝商业化和现代化',solution:'把冲突改为规模化复制与手艺真实性之间的选择',status:'已处理'},
      {level:'中',area:'语言语境',issue:'“祖师爷赏饭”直译会造成宗教含义误读',solution:'改为 The craft only lives when someone keeps the fire.',status:'已处理'},
      {level:'低',area:'平台合规',issue:'高温炉火与未成年人画面需要安全提示',solution:'仅由成年角色操作，并保留防护镜和安全距离',status:'通过'}
    ],
    comparisons:[
      {scene:'EP1 · 订单危机',original:'顾沉舟提出用机器批量复制纹样，林砚说“祖师爷不赏这碗饭”。',localized:'顾沉舟展示机器复制样品。林砚把两件作品放到灯下：机器那件没有手工掐丝留下的微小呼吸感。',reason:'以可见差异替代文化惯用语，保留“真实性不可复制”的内核。',impact:'骨架无变化',approved:false},
      {scene:'EP3 · 代际秘密',original:'祖父留下族谱，证明林家七代都是皇家匠人。',localized:'祖父留下七张烧蓝温度卡，每张背后记录一次失败和修正。',reason:'降低血统叙事，强化可被全球观众理解的经验传承。',impact:'低影响',approved:false},
      {scene:'EP6 · 最后一炉',original:'林砚拒绝投资，坚持独自守住老作坊。',localized:'林砚接受投资，但把“手工掐丝、工匠署名、学徒培养”写入合作底线。',reason:'从二元对抗升级为可持续文化商业模式，更符合现代社会价值。',impact:'主题增强',approved:false}
    ],
    bilingual:[
      {speaker:'林砚',zh:'火可以熄，但手艺不能断在我这里。',en:'The fire may go out. The craft will not end with me.'},
      {speaker:'顾沉舟',zh:'我要的不是一件仿古品，是一个还能活下去的故事。',en:'I do not want a replica. I want a living story.'},
      {speaker:'林砚',zh:'那就别复制它，和我一起把它传下去。',en:'Then do not copy it. Help me carry it forward.'}
    ],
    package:[
      {name:'中英双语剧本',format:'DOCX / Markdown',status:'就绪'},
      {name:'双语字幕',format:'SRT / VTT',status:'就绪'},
      {name:'文化资产保留报告',format:'PDF / JSON',status:'就绪'},
      {name:'跨文化风险台账',format:'JSON',status:'就绪'},
      {name:'海外平台发行包',format:'标题 / 简介 / 标签',status:'就绪'},
      {name:'下游制作接口',format:'StoryState JSON',status:'就绪'}
    ]
  };

  state = load() || fresh();

  function fresh(){return {loaded:false,running:false,active:'',completed:[],checkpoint:'',assetsApproved:false,localizationApproved:false,tab:'assets',data:clone(DEMO),logs:[]};}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch(e){return null;}}
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){}}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function notify(msg){if(typeof window.showToast==='function')window.showToast(msg);}
  function addLog(kind,title,detail){state.logs.push({kind:kind||'agent',title:title,detail:detail,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})});}

  function ensure(){var host=document.getElementById('yj-page-global');if(!host)return; if(!document.getElementById('yj-global-style'))injectStyle();render();}
  function injectStyle(){var style=document.createElement('style');style.id='yj-global-style';style.textContent=`
    #yj-page-global{min-height:calc(100vh - 64px);padding:22px 24px 90px;background:radial-gradient(circle at 15% 10%,rgba(95,124,255,.08),transparent 30%),radial-gradient(circle at 88% 18%,rgba(42,190,158,.08),transparent 27%),#f7f9fc;color:#293246}.yjg-shell{max-width:1500px;margin:auto}.yjg-hero,.yjg-panel{border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.72);backdrop-filter:blur(24px) saturate(1.15);box-shadow:0 18px 48px rgba(54,72,105,.08),inset 0 1px rgba(255,255,255,.95)}.yjg-hero{display:flex;justify-content:space-between;gap:20px;padding:22px 24px;border-radius:22px}.yjg-eyebrow{font-size:10px;font-weight:900;letter-spacing:1.3px;color:#3e8a79}.yjg-hero h2{margin:8px 0 5px;font-size:25px}.yjg-hero p{margin:0;color:#78869b;font-size:12px}.yjg-market{display:grid;grid-template-columns:repeat(3,auto);gap:7px;align-content:center}.yjg-market span{padding:7px 10px;border-radius:10px;background:rgba(238,248,246,.85);font-size:10px;color:#337967;font-weight:700}.yjg-stagebar{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;margin:15px 0}.yjg-stage{padding:10px;border:1px solid rgba(154,166,189,.14);border-radius:11px;background:rgba(255,255,255,.64);font-size:9px;color:#8c98aa}.yjg-stage b{display:block;margin-top:4px;color:#59677b}.yjg-stage.done{background:#edf9f5;color:#1d9979}.yjg-stage.active{border-color:#7665ed;box-shadow:0 0 0 3px rgba(118,101,237,.09)}.yjg-layout{display:grid;grid-template-columns:250px minmax(0,1fr) 290px;gap:14px}.yjg-panel{border-radius:18px;padding:16px}.yjg-source h3,.yjg-evidence h3{margin:0 0 12px;font-size:14px}.yjg-source-card{padding:13px;border-radius:13px;background:#f6f7fb}.yjg-source-card b{display:block;font-size:14px}.yjg-source-card p{font-size:10px;line-height:1.6;color:#78869a}.yjg-config{margin-top:12px;display:grid;gap:8px}.yjg-config label{font-size:9px;color:#8491a4}.yjg-config select{width:100%;margin-top:4px;padding:8px;border:1px solid #e2e7ef;border-radius:9px;background:rgba(255,255,255,.9);color:#445167}.yjg-run{width:100%;margin-top:12px;padding:11px;border:0;border-radius:11px;background:linear-gradient(135deg,#6f5ff0,#3e86f4);color:#fff;font-weight:800;cursor:pointer}.yjg-run:disabled{opacity:.5}.yjg-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}.yjg-tab{padding:7px 10px;border:0;border-radius:9px;background:#f1f3f8;color:#718096;font-size:10px;cursor:pointer}.yjg-tab.active{background:#eae7ff;color:#6754d6;font-weight:800}.yjg-main{min-height:520px}.yjg-card{padding:13px;margin:9px 0;border:1px solid rgba(153,166,190,.16);border-radius:13px;background:rgba(255,255,255,.68)}.yjg-card-head{display:flex;justify-content:space-between;gap:8px}.yjg-card h4{margin:0 0 5px;font-size:12px}.yjg-card p{margin:5px 0;color:#69778b;font-size:10px;line-height:1.6}.yjg-tag{padding:4px 7px;border-radius:7px;background:#edf7f4;color:#27826c;font-size:8px;font-weight:800}.yjg-risk-high{background:#fff0f0;color:#c75b5b}.yjg-risk-mid{background:#fff7e8;color:#a87124}.yjg-approve{margin-top:10px;padding:9px 12px;border:0;border-radius:9px;background:#1d9b78;color:white;font-size:10px;font-weight:800;cursor:pointer}.yjg-compare{display:grid;grid-template-columns:1fr 1fr;gap:9px}.yjg-compare section{padding:10px;border-radius:10px;background:#f6f7fb}.yjg-compare small{display:block;margin-bottom:6px;color:#8c98a9;font-size:8px}.yjg-line{display:grid;grid-template-columns:65px 1fr;gap:8px;margin:8px 0;padding:9px;border-radius:10px;background:#f7f8fb;font-size:10px}.yjg-line b{color:#5966a9}.yjg-pack{display:grid;grid-template-columns:1fr 1fr;gap:8px}.yjg-pack .yjg-card{margin:0}.yjg-log{padding:9px 0;border-bottom:1px solid #edf0f4}.yjg-log b{display:block;font-size:10px}.yjg-log p{margin:3px 0;color:#8490a2;font-size:9px;line-height:1.45}.yjg-log time{font-size:8px;color:#a3adba}.yjg-empty{padding:70px 20px;text-align:center;color:#92a0b2}.yjg-footer-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.yjg-footer-actions button{padding:9px 12px;border:1px solid #dfe5ee;border-radius:9px;background:white;color:#566378;cursor:pointer}.yjg-footer-actions .primary{background:#29365a;color:white;border-color:#29365a}
    @media(max-width:1150px){.yjg-layout{grid-template-columns:220px 1fr}.yjg-evidence{grid-column:1/-1}.yjg-stagebar{grid-template-columns:repeat(4,1fr)}}@media(max-width:760px){#yj-page-global{padding:12px 10px 70px}.yjg-hero{display:block}.yjg-market{grid-template-columns:1fr 1fr;margin-top:12px}.yjg-layout{grid-template-columns:1fr}.yjg-stagebar{grid-template-columns:1fr 1fr}.yjg-compare,.yjg-pack{grid-template-columns:1fr}}
  `;document.head.appendChild(style);}

  function render(){var host=document.getElementById('yj-page-global');if(!host)return;var d=state.data;host.innerHTML='<div class="yjg-shell">'+
    '<header class="yjg-hero"><div><span class="yjg-eyebrow">CULTURAL IP GLOBALIZATION STUDIO</span><h2>🌏 文化出海制片工作台</h2><p>保留中国文化内核，把故事转化为海外观众看得懂、愿意看、平台能够发行的短剧产品。</p></div><div class="yjg-market"><span>'+esc(d.market.region)+'</span><span>'+esc(d.market.language)+'</span><span>'+esc(d.market.platform)+'</span></div></header>'+
    '<div class="yjg-stagebar">'+STAGES.map(function(s,i){return '<div class="yjg-stage '+(state.completed.indexOf(s.id)>=0?'done ':'')+(state.active===s.id?'active':'')+'"><span>0'+(i+1)+'</span><b>'+esc(s.label)+'</b></div>';}).join('')+'</div>'+
    '<div class="yjg-layout"><aside class="yjg-panel yjg-source"><h3>出海任务配置</h3><div class="yjg-source-card"><b>'+esc(d.source.title)+'</b><p>'+esc(d.source.summary)+'</p><span class="yjg-tag">'+esc(d.source.type)+'</span></div><div class="yjg-config"><label>目标市场<select id="yjg-market"><option>东南亚</option><option>北美</option><option>欧洲</option><option>日韩</option><option>中东</option></select></label><label>目标语言<select><option>English + 简体中文</option><option>日本語 + 简体中文</option><option>Bahasa Melayu + 简体中文</option></select></label><label>发行平台<select><option>YouTube Shorts / TikTok</option><option>ReelShort / DramaBox</option><option>Instagram Reels</option></select></label></div><button class="yjg-run" data-yjg="run" '+(state.running||state.checkpoint?'disabled':'')+'>'+(state.loaded?(state.completed.length===STAGES.length?'✓ 出海包已完成':'▶ 继续运行 Agent'):'⚡ 载入并运行 Demo')+'</button></aside>'+
    '<main class="yjg-panel yjg-main"><div class="yjg-tabs">'+[['assets','文化资产'],['risk','风险雷达'],['compare','本地化对照'],['bilingual','双语剧本'],['package','发行交付包']].map(function(t){return '<button class="yjg-tab '+(state.tab===t[0]?'active':'')+'" data-yjg-tab="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>'+renderTab()+'</main>'+
    '<aside class="yjg-panel yjg-evidence"><h3>Agent Run 证据</h3>'+(state.logs.length?state.logs.slice().reverse().map(function(l){return '<div class="yjg-log"><b>'+esc(l.title)+'</b><p>'+esc(l.detail)+'</p><time>'+esc(l.time)+'</time></div>';}).join(''):'<div class="yjg-empty">运行后实时显示<br>Agent、Skill、检查与产出</div>')+'</aside></div>'+
    '<div class="yjg-footer-actions"><button data-yjg="reset">重置 Demo</button><button class="primary" data-yjg="export" '+(state.completed.length===STAGES.length?'':'disabled')+'>导出文化出海交付包</button></div></div>';bind();}

  function renderTab(){var d=state.data;if(!state.loaded)return '<div class="yjg-empty"><div style="font-size:42px;margin-bottom:12px">🌏</div><b>载入《最后一炉》非遗出海案例</b><p>评委将在一次运行中看到文化资产锁定、风险扫描、本地化改编、双语剧本和发行交付包。</p></div>';
    if(state.tab==='assets')return d.assets.map(function(x){return '<article class="yjg-card"><div class="yjg-card-head"><h4>🔒 '+esc(x.name)+'</h4><span class="yjg-tag">'+esc(x.kind)+'</span></div><p>'+esc(x.rule)+'</p><p>证据：'+esc(x.evidence)+'</p></article>';}).join('')+(state.checkpoint==='assets'?'<button class="yjg-approve" data-yjg="approve-assets">人工确认并锁定 3 项文化资产</button>':'');
    if(state.tab==='risk')return d.risks.map(function(x){return '<article class="yjg-card"><div class="yjg-card-head"><h4>'+esc(x.area)+' · '+esc(x.issue)+'</h4><span class="yjg-tag '+(x.level==='高'?'yjg-risk-high':x.level==='中'?'yjg-risk-mid':'')+'">'+esc(x.level)+'风险</span></div><p><b>处理：</b>'+esc(x.solution)+'</p><p>状态：'+esc(x.status)+'</p></article>';}).join('');
    if(state.tab==='compare')return d.comparisons.map(function(x){return '<article class="yjg-card"><div class="yjg-card-head"><h4>'+esc(x.scene)+'</h4><span class="yjg-tag">'+esc(x.impact)+'</span></div><div class="yjg-compare"><section><small>中国原版</small>'+esc(x.original)+'</section><section><small>海外本地化版本</small>'+esc(x.localized)+'</section></div><p><b>改编理由：</b>'+esc(x.reason)+'</p></article>';}).join('')+(state.checkpoint==='localization'?'<button class="yjg-approve" data-yjg="approve-localization">人工批准本地化方向</button>':'');
    if(state.tab==='bilingual')return '<h3>EP6 · 最后一炉｜高潮对白</h3>'+d.bilingual.map(function(x){return '<div class="yjg-line"><b>'+esc(x.speaker)+'</b><div><div>'+esc(x.zh)+'</div><div style="margin-top:5px;color:#607199">'+esc(x.en)+'</div></div></div>';}).join('');
    return '<div class="yjg-pack">'+d.package.map(function(x){return '<article class="yjg-card"><div class="yjg-card-head"><h4>✓ '+esc(x.name)+'</h4><span class="yjg-tag">'+esc(x.status)+'</span></div><p>'+esc(x.format)+'</p></article>';}).join('')+'</div>';
  }

  function bind(){var host=document.getElementById('yj-page-global');if(!host)return;host.querySelectorAll('[data-yjg-tab]').forEach(function(b){b.onclick=function(){state.tab=this.dataset.yjgTab;save();render();};});host.querySelectorAll('[data-yjg]').forEach(function(b){b.onclick=function(){action(this.dataset.yjg);};});}
  function action(name){if(name==='run')run();else if(name==='approve-assets')approveAssets();else if(name==='approve-localization')approveLocalization();else if(name==='reset'){if(confirm('重置文化出海 Demo？')){state=fresh();save();render();}}else if(name==='export')exportPack();}
  async function run(){if(state.running||state.checkpoint||state.completed.length===STAGES.length)return;if(!state.loaded){state.loaded=true;state.data=clone(DEMO);addLog('system','载入出海任务','《最后一炉》已进入东南亚英语市场适配流程。');}state.running=true;render();for(var i=state.completed.length;i<STAGES.length;i++){var s=STAGES[i];state.active=s.id;addLog('agent',s.agent+' 正在执行',s.skill+' · 检查：'+s.checks.join('、'));save();render();await wait(520);if(s.checkpoint==='assets'&&!state.assetsApproved){state.running=false;state.checkpoint='assets';state.tab='assets';addLog('human','等待文化资产确认','3项文化内核需要创作者锁定，防止本地化改写丢失中国文化身份。');save();render();return;}if(s.checkpoint==='localization'&&!state.localizationApproved){state.running=false;state.checkpoint='localization';state.tab='compare';addLog('human','等待本地化方向批准','请复核3处跨文化改编是否保持故事骨架。');save();render();return;}if(state.completed.indexOf(s.id)<0)state.completed.push(s.id);addLog('done',s.label+' 已完成',s.checks.length+'项检查通过，产出已写入证据链。');save();render();await wait(160);}state.running=false;state.active='supervision';state.tab='package';addLog('done','文化出海交付完成','文化保真、市场理解、双语表达、平台发行与下游结构化接口全部就绪。');save();render();notify('文化出海 Demo 已完成，可查看并导出发行交付包');}
  function approveAssets(){state.data.assets.forEach(function(x){x.locked=true;});state.assetsApproved=true;state.checkpoint='';if(state.completed.indexOf('asset_lock')<0)state.completed.push('asset_lock');addLog('human','人工锁定文化资产','景泰蓝工艺、最后一炉意象和祖孙传承已设为不可替换。');save();render();setTimeout(run,180);}
  function approveLocalization(){state.data.comparisons.forEach(function(x){x.approved=true;});state.localizationApproved=true;state.checkpoint='';if(state.completed.indexOf('localize')<0)state.completed.push('localize');addLog('human','人工批准本地化方向','3项改编均保持故事骨架，进入双语与发行生产。');save();render();setTimeout(run,180);}
  function exportPack(){if(state.completed.length!==STAGES.length){notify('请先完成全部出海流程');return;}var d=state.data;var lines=['# 云匠文化出海交付包','',d.source.title+' → '+d.market.country,'','## 目标市场','- 语言：'+d.market.language,'- 平台：'+d.market.platform,'- 受众：'+d.market.audience,'','## 文化资产'];d.assets.forEach(function(x){lines.push('- [已锁定] '+x.name+'：'+x.rule+'（'+x.evidence+'）');});lines.push('','## 本地化改编');d.comparisons.forEach(function(x){lines.push('','### '+x.scene,'- 原版：'+x.original,'- 海外版：'+x.localized,'- 理由：'+x.reason);});lines.push('','## 双语高潮对白');d.bilingual.forEach(function(x){lines.push('- '+x.speaker+'：'+x.zh+' / '+x.en);});var blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='云匠-最后一炉-文化出海交付包.md';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);addLog('human','导出文化出海交付包','双语剧本、文化资产、风险台账与发行物料已导出。');save();render();}

  window.YJGlobalWorkbench={open:function(){ensure();},reset:function(){state=fresh();save();render();},getState:function(){return clone(state);},runDemoInstant:async function(){if(!state.loaded){state=fresh();}while(state.completed.length<STAGES.length){if(state.checkpoint==='assets')approveAssets();else if(state.checkpoint==='localization')approveLocalization();else await run();await wait(30);}return clone(state);}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ensure,0);});else setTimeout(ensure,0);
})();
