/**
 * 云匠文学 / 漫画 IP 改编工作台
 * 文本或视觉事实层 → 骨架锁定 → 影视化诊断 → 人工决策 → 分场交付
 * @version 1.1.0
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'yunjiang_adaptation_workbench_v1';
  var state = loadState() || freshState();

  var DEMO = {
    settings: { source_name: '《灯影里的旧账》', source_author: '演示文本', target_episode_count: 6, total_chapters: 3, total_chunks: 6 },
    chapters: [
      { chapter: 1, title: '返乡', summary: '许知遥回到旧城，发现父亲留下的修表铺即将被拆。' },
      { chapter: 2, title: '旧账', summary: '账簿揭示父亲曾替街坊垫付医疗费用，却被误认为侵吞公款。' },
      { chapter: 3, title: '钟声', summary: '许知遥在钟楼听证会上还原真相，保住街区公共记忆。' }
    ],
    characters: [
      { id: 'char_xu', name: '许知遥', identity: '城市规划师', motivation: '查清父亲旧案并决定是否保留旧街', confidence: 'high', sources: ['c01','c03'] },
      { id: 'char_luo', name: '罗伯', identity: '修表铺老伙计', motivation: '守住真相与街坊体面', confidence: 'high', sources: ['c02','c04'] },
      { id: 'char_zhou', name: '周衡', identity: '更新项目负责人', motivation: '在工期与公共价值之间作选择', confidence: 'medium', sources: ['c03','c05'] }
    ],
    events: [
      { id: 'evt_1', summary: '许知遥收到拆迁通知', importance: 'critical', sources: ['c01'] },
      { id: 'evt_2', summary: '罗伯交出父亲留下的账簿', importance: 'critical', sources: ['c03'] },
      { id: 'evt_3', summary: '许知遥在听证会上公开账簿真相', importance: 'critical', sources: ['c05','c06'] }
    ],
    invariants: [
      { id: 'inv_1', type: '主题', title: '记忆不是发展的对立面', description: '现代化必须尊重普通人的生活史。', lock: 'HARD', sources: ['c01','c06'], approved: false },
      { id: 'inv_2', type: '因果', title: '账簿推动真相公开', description: '账簿必须从父亲污名连接到最终澄清。', lock: 'HARD', sources: ['c03','c05'], approved: false },
      { id: 'inv_3', type: '人物', title: '许知遥主动完成选择', description: '主角不能依靠巧合或他人代替完成价值抉择。', lock: 'HARD', sources: ['c05','c06'], approved: false }
    ],
    beats: [
      { id: 'beat_1', no: 1, title: '返乡与拆迁通知', fn: '建立外部目标', policy: '保留', sources: ['c01'] },
      { id: 'beat_2', no: 2, title: '三页内心回忆', fn: '解释父女隔阂', policy: '改写', sources: ['c02'] },
      { id: 'beat_3', no: 3, title: '发现账簿', fn: '中点揭示', policy: '保留', sources: ['c03'] },
      { id: 'beat_4', no: 4, title: '强迫老人作证', fn: '获得关键证词', policy: '改写', sources: ['c04'] },
      { id: 'beat_5', no: 5, title: '钟楼听证会', fn: '高潮与主题兑现', policy: '保留', sources: ['c05','c06'] }
    ],
    issues: [
      { id: 'issue_1', beat: 'beat_2', type: '不可视化', severity: '高', title: '内心独白不可直接影视化', excerpt: '她想起父亲沉默的十年……', diagnosis: '连续心理描写缺少可见行动，短剧节奏会停滞。', value: '代际沟通', sources: ['c02'] },
      { id: 'issue_2', beat: 'beat_4', type: '价值冲突', severity: '高', title: '以胁迫老人换取证词', excerpt: '她以撤销补助相逼，老人终于开口。', diagnosis: '主角通过权力压迫弱者取得正义，损害人物认同。', value: '尊重与程序正义', sources: ['c04'] },
      { id: 'issue_3', beat: 'beat_5', type: '制作成本', severity: '中', title: '千人钟楼集会成本过高', excerpt: '全城人聚集钟楼广场……', diagnosis: '群众规模和夜景调度不适合低成本短剧。', value: '公共参与', sources: ['c05'] }
    ],
    proposals: [
      { id: 'prop_1', issue: 'issue_1', strategy: '心理行动化', original: '三页内心回忆父亲沉默的十年。', adapted: '许知遥修复父亲遗留的停摆怀表；每装回一个齿轮，穿插一段未发送的语音。', rationale: '把内心回忆转为持续动作和声音线索。', impact: '骨架无变化', selected: true, status: 'passed' },
      { id: 'prop_2', issue: 'issue_2', strategy: '胁迫改为知情同意', original: '许知遥以撤销补助相逼，老人被迫作证。', adapted: '许知遥先公开自己掌握的证据，并承诺匿名保护；老人主动交出录音。', rationale: '保留获得证词的情节功能，同时符合程序正义。', impact: '骨架无变化', selected: true, status: 'pending' },
      { id: 'prop_3', issue: 'issue_3', strategy: '大型集会轻量化', original: '全城人在夜晚聚集钟楼广场。', adapted: '钟楼只保留12名核心街坊，其他居民通过旧照片投影和直播弹幕参与。', rationale: '降低制作成本，并强化公共记忆的视觉符号。', impact: '低影响', selected: true, status: 'pending' }
    ],
    scenes: [
      { ep: 1, scene: 1, location: '旧街修表铺', goal: '让许知遥面对拆迁决定', conflict: '职业立场与家族记忆冲突', visual: '停摆怀表与墙上红色拆字同框' },
      { ep: 2, scene: 3, location: '修表铺后间', goal: '发现账簿的真实用途', conflict: '罗伯是否交出秘密', visual: '账页夹着一张张医院收据' },
      { ep: 6, scene: 4, location: '钟楼听证室', goal: '公开真相并形成更新共识', conflict: '工期压力与公众证据对峙', visual: '怀表重新走动，投影中的老街照片逐格亮起' }
    ]
  };

  var MANGA_DEMO = clone(DEMO);
  MANGA_DEMO.settings = { source_name: '《末班渡口》漫画样章', source_author: '云匠演示', target_episode_count: 4, total_chapters: 1, total_chunks: 3, total_pages: 3, total_panels: 8 };
  MANGA_DEMO.pages = [
    { id:'pg01', no:1, panels:['p01','p02','p03'] }, { id:'pg02', no:2, panels:['p04','p05','p06'] }, { id:'pg03', no:3, panels:['p07','p08'] }
  ];
  MANGA_DEMO.panels = [
    {id:'p01',page:1,order:1,scene:'暴雨中的废弃渡口，末班船灯亮起',tone:'storm',sources:['pg01#p01']},
    {id:'p02',page:1,order:2,scene:'女孩攥着停摆怀表冲向栈桥',tone:'run',sources:['pg01#p02']},
    {id:'p03',page:1,order:3,scene:'船夫罗伯挡住登船口',tone:'ferry',sources:['pg01#p03']},
    {id:'p04',page:2,order:4,scene:'怀表背面刻着旧城钟楼坐标',tone:'watch',sources:['pg02#p01']},
    {id:'p05',page:2,order:5,scene:'闪回：父亲把账簿藏入钟楼齿轮箱',tone:'memory',sources:['pg02#p02']},
    {id:'p06',page:2,order:6,scene:'女孩放弃登船，转身奔向钟楼',tone:'turn',sources:['pg02#p03']},
    {id:'p07',page:3,order:7,scene:'钟楼齿轮转动，账页从暗格落下',tone:'clock',sources:['pg03#p01']},
    {id:'p08',page:3,order:8,scene:'渡船远去，女孩在晨光里翻开账簿',tone:'dawn',sources:['pg03#p02']}
  ];
  MANGA_DEMO.speech = [
    {id:'b01',panel:'p02',content:'等等！这是最后一班吗？',speaker:'许知遥',confidence:98,corrected:false},
    {id:'b02',panel:'p03',content:'过了十二点，河只送走想逃的人。',speaker:'罗伯',confidence:82,corrected:false},
    {id:'b03',panel:'p06',content:'我不是回来逃走的。',speaker:'许知遥',confidence:99,corrected:false}
  ];
  MANGA_DEMO.shots = [
    {panels:['p01','p02','p03'],scene:'EP1-SC1',shot:'远景 → 近景',move:'推进',note:'保留暴雨与怀表作为开场钩子'},
    {panels:['p04','p05','p06'],scene:'EP2-SC2',shot:'特写 → 闪回',move:'匹配剪辑',note:'把跨页信息压缩为怀表视觉线索'},
    {panels:['p07','p08'],scene:'EP4-SC4',shot:'中近景 → 大全景',move:'缓慢拉远',note:'兑现账簿与主动选择'}
  ];
  MANGA_DEMO.characters = [
    { id:'char_xu',name:'许知遥',identity:'返乡女孩',motivation:'查清怀表与父亲旧案',confidence:'high',sources:['pg01#p02','pg03#p02'] },
    { id:'char_luo',name:'罗伯',identity:'末班渡船船夫',motivation:'阻止她逃避真相',confidence:'medium',sources:['pg01#p03'] },
    { id:'char_zhou',name:'父亲',identity:'钟楼修理员',motivation:'留下能够澄清旧案的账簿',confidence:'medium',sources:['pg02#p02'] }
  ];
  MANGA_DEMO.events = [
    {id:'evt_1',summary:'许知遥赶上末班船',importance:'critical',sources:['pg01#p01','pg01#p02']},
    {id:'evt_2',summary:'怀表坐标触发父亲藏账簿的记忆',importance:'critical',sources:['pg02#p01','pg02#p02']},
    {id:'evt_3',summary:'许知遥放弃离开并找到账簿',importance:'critical',sources:['pg02#p03','pg03#p01']}
  ];
  MANGA_DEMO.invariants = [
    {id:'inv_1',type:'主题',title:'面对真相而非逃离',description:'主角必须主动回头寻找父亲留下的事实。',lock:'HARD',sources:['pg01#p02','pg03#p02'],approved:false},
    {id:'inv_2',type:'因果',title:'怀表连接渡口与钟楼',description:'怀表坐标必须推动主角改变行动方向。',lock:'HARD',sources:['pg02#p01','pg02#p03'],approved:false},
    {id:'inv_3',type:'人物',title:'许知遥主动做出选择',description:'船夫只能提醒，不能代替主角完成决定。',lock:'HARD',sources:['pg01#p03','pg02#p03'],approved:false}
  ];
  MANGA_DEMO.beats = [
    {id:'beat_1',no:1,title:'暴雨赶船',fn:'建立逃离目标',policy:'保留',sources:['pg01#p01','pg01#p02']},
    {id:'beat_2',no:2,title:'船夫谜语',fn:'制造价值阻力',policy:'改写',sources:['pg01#p03']},
    {id:'beat_3',no:3,title:'怀表坐标',fn:'中点线索揭示',policy:'保留',sources:['pg02#p01']},
    {id:'beat_4',no:4,title:'跨页闪回',fn:'补充父亲行动',policy:'改写',sources:['pg02#p02']},
    {id:'beat_5',no:5,title:'回头与找到账簿',fn:'选择兑现',policy:'保留',sources:['pg02#p03','pg03#p01']}
  ];
  MANGA_DEMO.issues = [
    {id:'issue_1',beat:'beat_2',type:'对白归属',severity:'中',title:'跨格对白说话人存在歧义',excerpt:'过了十二点，河只送走想逃的人。',diagnosis:'对白框尾部被雨线遮挡，需要人工确认说话人。',value:'人物一致',sources:['pg01#p03']},
    {id:'issue_2',beat:'beat_4',type:'时空跳转',severity:'高',title:'无标记闪回容易造成理解断层',excerpt:'父亲把账簿藏进齿轮箱。',diagnosis:'纸面跨页可成立，真人短剧需增加声音桥或色温提示。',value:'叙事清晰',sources:['pg02#p02']},
    {id:'issue_3',beat:'beat_1',type:'制作成本',severity:'中',title:'暴雨渡口夜景成本偏高',excerpt:'整页暴雨与远处渡船。',diagnosis:'需要用局部雨幕、声音与船灯控制制作规模。',value:'制作可行',sources:['pg01#p01']}
  ];
  MANGA_DEMO.proposals = [
    {id:'prop_1',issue:'issue_1',strategy:'人工校准说话人',original:'对白尾部被雨线遮挡。',adapted:'由罗伯近景开口，并用视线关系明确指向许知遥。',rationale:'消除对白归属歧义。',impact:'骨架无变化',selected:true,status:'passed'},
    {id:'prop_2',issue:'issue_2',strategy:'闪回视觉桥',original:'漫画跨页直接进入父亲闪回。',adapted:'怀表滴水声转成齿轮声，冷蓝雨夜匹配剪辑为暖色钟楼。',rationale:'保留线索功能并明确时空转换。',impact:'骨架无变化',selected:true,status:'pending'},
    {id:'prop_3',issue:'issue_3',strategy:'雨夜场景轻量化',original:'大面积暴雨和行驶渡船。',adapted:'只拍栈桥局部雨幕与摇晃船灯，远船通过声音和反光表达。',rationale:'降低制作成本但保留压迫感。',impact:'低影响',selected:true,status:'pending'}
  ];
  MANGA_DEMO.scenes = [
    {ep:1,scene:1,location:'旧渡口·夜',goal:'让许知遥赶上末班船',conflict:'她想逃离，罗伯拒绝放行',visual:'雨幕里船灯忽明忽暗，怀表停在23:57'},
    {ep:2,scene:2,location:'栈桥候船棚·夜',goal:'发现怀表背后的钟楼坐标',conflict:'是否相信父亲留下的线索',visual:'水珠滑过表盖，刻痕在闪电下显现'},
    {ep:4,scene:4,location:'旧钟楼·黎明',goal:'找到账簿并完成主动选择',conflict:'拆除倒计时逼近',visual:'齿轮重启，账页落入晨光'}
  ];

  var STAGES = [
    { id: 'source_import', label: '导入与分块', agent: '文本解剖师', skill: 'source-chunking', checks: ['章节边界','出处索引'] },
    { id: 'fact_extract', label: '原著事实提取', agent: '角色考古学家 × 情节编织师', skill: 'source-fact-extraction', checks: ['禁止脑补','置信度'] },
    { id: 'skeleton_lock', label: '故事骨架确认', agent: '改编总监', skill: 'story-invariant-lock', checks: ['主题不变','因果不变'], checkpoint: 'skeleton' },
    { id: 'filmability', label: '影视化诊断', agent: '场景美术师 × 合规审核官', skill: 'filmability-diagnosis', checks: ['可拍性','现代价值'] },
    { id: 'proposal', label: '改编方案', agent: '改编编剧', skill: 'adaptation-proposal', checks: ['最小改动','影响范围'], checkpoint: 'proposal' },
    { id: 'validation', label: '一致性复核', agent: '知识校验官', skill: 'adaptation-validation', checks: ['骨架守恒','角色一致'] },
    { id: 'delivery', label: '分场交付', agent: '二创协调师', skill: 'adaptation-delivery', checks: ['变更台账','分场可拍'] }
  ];

  var MANGA_STAGES = [
    {id:'page_prepare',label:'页面预处理',agent:'视觉资料员',skill:'manga-page-normalization',checks:['页序','阅读方向']},
    {id:'panel_extract',label:'画格与对白',agent:'分镜导演 × 台词打磨师',skill:'manga-panel-segmentation',checks:['画格边界','OCR与说话人']},
    {id:'fact_extract',label:'视觉事实提取',agent:'角色考古学家 × 情节编织师',skill:'manga-event-reconstruction',checks:['跨格人物','动作因果']},
    {id:'skeleton_lock',label:'故事骨架确认',agent:'改编总监',skill:'story-invariant-lock',checks:['主题不变','因果不变'],checkpoint:'skeleton'},
    {id:'filmability',label:'影视化诊断',agent:'场景美术师 × 合规审核官',skill:'filmability-diagnosis',checks:['可拍性','现代价值']},
    {id:'proposal',label:'镜头改编方案',agent:'分镜导演 × 改编编剧',skill:'manga-shot-mapping',checks:['画格到镜头','影响范围'],checkpoint:'proposal'},
    {id:'validation',label:'一致性复核',agent:'知识校验官',skill:'manga-adaptation-validation',checks:['页格溯源','角色连续']},
    {id:'delivery',label:'分场交付',agent:'二创协调师',skill:'adaptation-delivery',checks:['镜头映射','分场可拍']}
  ];

  function freshState() {
    return { mode: 'literary', loaded: false, running: false, completed: [], active: '', checkpoint: '', tab: 'source', logs: [], skeletonApproved: false, proposalApproved: false, data: null, updatedAt: '' };
  }

  function stages() { return state.mode === 'manga' ? MANGA_STAGES : STAGES; }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; } }
  function saveState() { state.updatedAt = new Date().toISOString(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function injectStyles() {
    if (document.getElementById('yj-adaptation-styles')) return;
    var style = document.createElement('style');
    style.id = 'yj-adaptation-styles';
    style.textContent = `
      #yj-page-adaptation{background:radial-gradient(circle at 16% 8%,rgba(120,119,255,.08),transparent 32%),linear-gradient(180deg,#f8f9fd 0%,#f5f7fb 100%);min-height:calc(100vh - 56px);color:#273247}
      .yja-shell{width:min(1540px,calc(100% - 28px));margin:0 auto;padding:20px 0 50px}
      .yja-top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:14px;padding:18px 20px;border:1px solid rgba(255,255,255,.9);border-radius:22px;background:rgba(255,255,255,.72);box-shadow:0 14px 42px rgba(59,69,104,.07),inset 0 1px rgba(255,255,255,.95);backdrop-filter:blur(24px) saturate(1.2)}
      .yja-title small{display:block;color:#7469cf;font-size:10px;font-weight:800;letter-spacing:1.5px}.yja-title h2{margin:5px 0 3px;font-size:24px}.yja-title p{margin:0;color:#8490a4;font-size:12px}.yja-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .yja-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 14px;border:1px solid rgba(98,89,180,.15);border-radius:11px;background:rgba(255,255,255,.76);color:#59657a;font:700 12px/1 inherit;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.9);transition:.2s ease}.yja-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(67,56,138,.1)}.yja-btn.primary{border:none;color:white;background:linear-gradient(135deg,#7867f4,#4f8df7);box-shadow:0 9px 22px rgba(92,91,225,.22)}.yja-btn.success{border:none;color:#fff;background:linear-gradient(135deg,#24b98a,#25a6a1)}.yja-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}.yja-save{color:#17a779;font-size:11px}
      .yja-import{display:grid;grid-template-columns:1.35fr .65fr;gap:14px;margin-bottom:14px}.yja-import-main,.yja-import-side{border:1px solid rgba(255,255,255,.9);border-radius:20px;background:rgba(255,255,255,.7);box-shadow:0 12px 36px rgba(65,73,110,.06);backdrop-filter:blur(22px);padding:20px}.yja-import-main h3{margin:0 0 7px;font-size:18px}.yja-import-main p{margin:0;color:#7f8b9f;font-size:12px;line-height:1.7}.yja-drop{display:flex;align-items:center;gap:14px;margin-top:16px;padding:18px;border:1px dashed rgba(112,103,211,.28);border-radius:16px;background:rgba(247,246,255,.62)}.yja-drop i{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#ece9ff,#e6f5ff);font-style:normal;font-size:20px}.yja-drop b,.yja-drop small{display:block}.yja-drop small{margin-top:4px;color:#99a2b2}.yja-import-side b{display:block;margin-bottom:10px}.yja-rights{display:flex;align-items:flex-start;gap:8px;color:#667085;font-size:11px;line-height:1.55}.yja-rights input{margin-top:2px;accent-color:#7565e8}.yja-sample{margin-top:13px;width:100%}
      .yja-grid{display:grid;grid-template-columns:230px minmax(0,1fr) 300px;gap:14px;align-items:start}.yja-panel{border:1px solid rgba(255,255,255,.9);border-radius:20px;background:rgba(255,255,255,.72);box-shadow:0 12px 38px rgba(61,69,102,.06),inset 0 1px rgba(255,255,255,.94);backdrop-filter:blur(24px) saturate(1.15);overflow:hidden}.yja-panel-head{padding:15px 16px;border-bottom:1px solid rgba(118,127,153,.09)}.yja-panel-head b{font-size:13px}.yja-panel-head small{display:block;margin-top:4px;color:#9aa3b3;font-size:10px}
      .yja-stages{padding:9px}.yja-stage{position:relative;display:grid;grid-template-columns:30px 1fr 9px;gap:9px;align-items:center;padding:11px 8px;border-radius:13px;color:#8b94a6;transition:.2s}.yja-stage+.yja-stage:before{content:'';position:absolute;left:22px;top:-8px;width:1px;height:11px;background:#dde1eb}.yja-stage .num{width:27px;height:27px;display:grid;place-items:center;border-radius:9px;background:#f1f3f8;color:#929bad;font-size:10px;font-weight:800}.yja-stage b,.yja-stage small{display:block}.yja-stage b{font-size:11px}.yja-stage small{margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#abb2c0}.yja-stage .dot{width:7px;height:7px;border-radius:50%;background:#d5d9e2}.yja-stage.done{color:#287d65;background:rgba(233,250,243,.66)}.yja-stage.done .num{background:#dff6ec;color:#139369}.yja-stage.done .dot{background:#20ba84}.yja-stage.active{color:#5e52c6;background:rgba(240,238,255,.9)}.yja-stage.active .num{color:#fff;background:linear-gradient(135deg,#7665ef,#5e8ef5)}.yja-stage.active .dot{background:#765ff1;animation:yjaPulse 1.1s infinite}.yja-stage.waiting{color:#b2771d;background:#fff8ea}.yja-stage.waiting .dot{background:#efad43}.yja-stage.waiting .num{background:#fff0c9;color:#a96915}@keyframes yjaPulse{50%{box-shadow:0 0 0 7px rgba(118,95,241,0)}}
      .yja-source-card{margin:8px 10px 12px;padding:12px;border-radius:14px;background:linear-gradient(135deg,#f7f8fc,#f5f2ff)}.yja-source-card b,.yja-source-card span{display:block}.yja-source-card b{font-size:12px}.yja-source-card span{margin-top:4px;color:#8e97a8;font-size:10px}.yja-source-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:10px}.yja-source-stats em{padding:7px 3px;border-radius:8px;background:rgba(255,255,255,.8);text-align:center;color:#848ea1;font:normal 9px/1.3 inherit}.yja-source-stats strong{display:block;color:#39465c;font-size:13px}
      .yja-main{min-height:670px}.yja-status{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:linear-gradient(90deg,rgba(242,240,255,.85),rgba(239,248,255,.7));border-bottom:1px solid rgba(113,101,210,.08)}.yja-status-copy{display:flex;align-items:center;gap:10px}.yja-agent-orb{width:34px;height:34px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#7363ee,#48a8ed);color:#fff;box-shadow:0 8px 18px rgba(94,92,218,.2)}.yja-status b,.yja-status small{display:block}.yja-status b{font-size:12px}.yja-status small{margin-top:3px;color:#8d96a7;font-size:10px}.yja-progress{min-width:160px}.yja-progress span{display:flex;justify-content:space-between;color:#8a93a5;font-size:9px}.yja-progress i{display:block;height:5px;margin-top:6px;border-radius:4px;background:#e4e6ef;overflow:hidden}.yja-progress i:after{content:'';display:block;width:var(--progress,0%);height:100%;border-radius:inherit;background:linear-gradient(90deg,#7764ee,#45a0ef);transition:.5s}
      .yja-tabs{display:flex;gap:4px;padding:12px 14px 0;border-bottom:1px solid rgba(120,128,151,.09);overflow:auto}.yja-tab{padding:9px 12px;border:0;border-bottom:2px solid transparent;background:transparent;color:#8d96a8;font:700 11px/1 inherit;white-space:nowrap;cursor:pointer}.yja-tab.active{color:#6256ce;border-color:#7563ed}.yja-content{padding:16px;min-height:490px}.yja-section-title{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px}.yja-section-title h3{margin:0;font-size:16px}.yja-section-title p{margin:4px 0 0;color:#939cab;font-size:10px}.yja-chip{display:inline-flex;padding:4px 7px;border-radius:7px;background:#f1efff;color:#7161d5;font-size:9px;font-weight:750}.yja-chip.warn{background:#fff2d9;color:#b0701d}.yja-chip.good{background:#e6f8f1;color:#138263}.yja-chip.danger{background:#fff0f0;color:#bc5158}
      .yja-timeline{position:relative;padding-left:18px}.yja-timeline:before{content:'';position:absolute;left:5px;top:12px;bottom:12px;width:1px;background:#dfe3eb}.yja-beat{position:relative;display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px 12px;margin-bottom:8px;border:1px solid rgba(132,141,163,.11);border-radius:13px;background:rgba(255,255,255,.76)}.yja-beat:before{content:'';position:absolute;left:-17px;top:17px;width:8px;height:8px;border:3px solid #f7f8fc;border-radius:50%;background:#7a6aec}.yja-beat b,.yja-beat small{display:block}.yja-beat b{font-size:11px}.yja-beat small{margin-top:4px;color:#929bab;font-size:9px}.yja-source-link{color:#6e63cb;font:9px monospace}
      .yja-invariants{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:14px}.yja-invariant{padding:13px;border:1px solid rgba(127,113,219,.12);border-radius:14px;background:linear-gradient(145deg,#fff,#f8f7ff)}.yja-invariant header{display:flex;justify-content:space-between}.yja-invariant b{display:block;margin:9px 0 5px;font-size:11px}.yja-invariant p{min-height:45px;margin:0;color:#7e889a;font-size:9px;line-height:1.6}.yja-invariant footer{display:flex;justify-content:space-between;align-items:center;margin-top:9px;color:#7869d4;font:9px monospace}.yja-invariant.approved{border-color:rgba(39,184,132,.25);background:linear-gradient(145deg,#fff,#f1fbf7)}
      .yja-checkpoint{padding:14px;border:1px solid rgba(225,166,63,.22);border-radius:15px;background:linear-gradient(135deg,#fffaf0,#fff6e4)}.yja-checkpoint h4{margin:0 0 5px;color:#8f5a16;font-size:12px}.yja-checkpoint p{margin:0 0 11px;color:#98784e;font-size:10px;line-height:1.6}.yja-checkpoint-actions{display:flex;gap:7px}
      .yja-issue{display:grid;grid-template-columns:96px 1fr auto;gap:12px;padding:12px;margin-bottom:8px;border:1px solid rgba(136,143,163,.12);border-radius:14px;background:rgba(255,255,255,.78)}.yja-issue .quote{padding:9px;border-radius:9px;background:#f5f6fa;color:#7b8494;font:9px/1.55 serif}.yja-issue b{font-size:11px}.yja-issue p{margin:5px 0;color:#818b9d;font-size:9px;line-height:1.55}.yja-issue-tags{display:flex;gap:5px;flex-wrap:wrap}
      .yja-proposal{margin-bottom:10px;border:1px solid rgba(124,113,205,.13);border-radius:15px;background:rgba(255,255,255,.8);overflow:hidden}.yja-proposal-head{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;background:#faf9ff}.yja-proposal-head label{display:flex;align-items:center;gap:7px;color:#4a5568;font-size:11px;font-weight:800}.yja-proposal-head input{accent-color:#7161e3}.yja-compare{display:grid;grid-template-columns:1fr 30px 1fr;gap:8px;align-items:stretch;padding:11px}.yja-copy{padding:11px;border-radius:11px;background:#f6f7fa}.yja-copy.new{background:#f0f8f6}.yja-copy small,.yja-copy p{display:block}.yja-copy small{color:#99a1af;font-size:8px;font-weight:800}.yja-copy p{margin:7px 0 0;color:#626d7f;font-size:10px;line-height:1.65}.yja-arrow{display:grid;place-items:center;color:#8071e4}.yja-proposal-foot{display:flex;justify-content:space-between;gap:8px;padding:0 12px 11px;color:#8992a2;font-size:9px}.yja-scenes{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.yja-scene{padding:13px;border:1px solid rgba(130,140,163,.12);border-radius:14px;background:#fff}.yja-scene header{display:flex;justify-content:space-between;color:#7465d1;font-size:9px;font-weight:800}.yja-scene h4{margin:9px 0 7px;font-size:12px}.yja-scene dl{margin:0}.yja-scene dt{margin-top:7px;color:#9aa2b0;font-size:8px}.yja-scene dd{margin:2px 0 0;color:#667184;font-size:9px;line-height:1.5}
      .yja-evidence{position:sticky;top:72px}.yja-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:10px}.yja-metric{padding:9px 5px;border-radius:10px;background:#f6f7fa;text-align:center;color:#969eac;font-size:8px}.yja-metric b{display:block;margin-bottom:3px;color:#344156;font-size:14px}.yja-live{margin:0 10px 9px;padding:11px;border:1px solid rgba(119,101,225,.12);border-radius:13px;background:linear-gradient(135deg,#f5f3ff,#f1f8ff)}.yja-live small,.yja-live b,.yja-live span{display:block}.yja-live small{color:#8576dc;font-size:8px;font-weight:800}.yja-live b{margin-top:5px;font-size:11px}.yja-live span{margin-top:3px;color:#8e97a8;font:9px monospace}.yja-live.running{animation:yjaCardBreath 1.4s ease-in-out infinite}@keyframes yjaCardBreath{50%{box-shadow:0 0 0 6px rgba(117,98,233,.05),0 8px 24px rgba(87,75,177,.12)}}
      .yja-logs{max-height:420px;overflow:auto;padding:0 10px 12px}.yja-log{position:relative;margin:0 0 7px;padding:9px 9px 9px 12px;border-left:2px solid #a69beb;border-radius:0 10px 10px 0;background:#fafaff}.yja-log.human{border-color:#e4ac4f;background:#fffaf1}.yja-log.done{border-color:#35b78a;background:#f3fbf8}.yja-log time{display:block;color:#a5abba;font:8px monospace}.yja-log b{display:block;margin:3px 0;color:#536075;font-size:9px}.yja-log p{margin:0;color:#8b94a4;font-size:8px;line-height:1.5}.yja-empty{display:grid;place-items:center;min-height:430px;text-align:center;color:#929bab}.yja-empty i{display:grid;place-items:center;width:72px;height:72px;margin:0 auto 13px;border-radius:22px;background:linear-gradient(135deg,#eeeaff,#e6f5ff);font-style:normal;font-size:30px}.yja-empty b{display:block;color:#526075;font-size:14px}.yja-empty p{max-width:390px;margin:7px auto 16px;font-size:10px;line-height:1.7}
      [data-theme="dark"] #yj-page-adaptation{background:#0d1322;color:#e9edfa}[data-theme="dark"] .yja-top,[data-theme="dark"] .yja-panel,[data-theme="dark"] .yja-import-main,[data-theme="dark"] .yja-import-side{background:rgba(21,29,48,.86);border-color:rgba(136,123,225,.14)}[data-theme="dark"] .yja-main [class*="yja-"]{border-color:rgba(139,128,220,.13)}[data-theme="dark"] .yja-beat,[data-theme="dark"] .yja-invariant,[data-theme="dark"] .yja-issue,[data-theme="dark"] .yja-proposal,[data-theme="dark"] .yja-scene{background:#151e30;color:#e7ebf5}[data-theme="dark"] .yja-copy{background:#111a2b}[data-theme="dark"] .yja-copy.new{background:#10241f}[data-theme="dark"] .yja-proposal-head,[data-theme="dark"] .yja-log{background:#172034}[data-theme="dark"] .yja-stage.active{background:#262447}
      [data-theme="dark"] .yja-status{background:linear-gradient(90deg,#1c2740,#18283d);color:#f0f3fb}[data-theme="dark"] .yja-stage.done{background:#17362f;color:#79ddbd}[data-theme="dark"] .yja-stage.done small{color:#80bbaa}[data-theme="dark"] .yja-stage .num{background:#222d42;color:#aeb8ca}[data-theme="dark"] .yja-stage.done .num{background:#245345;color:#94e8cd}[data-theme="dark"] .yja-source-card{background:linear-gradient(135deg,#182337,#211f3d)}[data-theme="dark"] .yja-source-card b,[data-theme="dark"] .yja-source-stats strong{color:#eef2fb}[data-theme="dark"] .yja-source-stats em,[data-theme="dark"] .yja-metric{background:#1d2940;color:#9eabc0}[data-theme="dark"] .yja-live{background:linear-gradient(135deg,#272447,#172d43);color:#f0f2fb}[data-theme="dark"] .yja-checkpoint{background:linear-gradient(135deg,#342b1c,#2c251a);border-color:rgba(229,173,75,.24)}[data-theme="dark"] .yja-checkpoint h4{color:#f1c978}[data-theme="dark"] .yja-checkpoint p{color:#c7aa77}[data-theme="dark"] .yja-btn{background:#202b42;color:#dbe3f0;border-color:rgba(153,164,190,.18)}[data-theme="dark"] .yja-invariant p,[data-theme="dark"] .yja-beat small,[data-theme="dark"] .yja-issue p,[data-theme="dark"] .yja-copy p,[data-theme="dark"] .yja-scene dd,[data-theme="dark"] .yja-log p{color:#aab5c8}[data-theme="dark"] .yja-tabs{background:rgba(12,18,32,.26)}
      .yja-mode-switch{display:inline-flex;gap:3px;padding:3px;border:1px solid rgba(111,99,203,.13);border-radius:12px;background:rgba(245,245,252,.72)}.yja-mode-switch button{border:0;border-radius:9px;background:transparent;color:#8791a4;font:750 11px/1 inherit;padding:9px 13px;cursor:pointer}.yja-mode-switch button.active{color:#fff;background:linear-gradient(135deg,#7564ec,#4d92ef);box-shadow:0 6px 16px rgba(93,88,208,.2)}
      .yja-format-list{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.yja-format-list span{padding:5px 8px;border-radius:8px;background:#f0effb;color:#7166bb;font-size:9px;font-weight:800}.yja-manga-pages{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.yja-manga-page{padding:8px;border:1px solid rgba(108,99,177,.14);border-radius:14px;background:#eceef4;box-shadow:0 8px 20px rgba(49,55,81,.07)}.yja-manga-page>header{display:flex;justify-content:space-between;padding:2px 2px 8px;color:#6d668e;font-size:9px;font-weight:800}.yja-panel-art{position:relative;min-height:104px;margin-bottom:6px;padding:10px;border:2px solid #31384c;border-radius:7px;background:linear-gradient(145deg,#dce3ec,#a8b5c8);overflow:hidden;color:#20283a}.yja-panel-art:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 12px,rgba(255,255,255,.2) 13px,transparent 14px);opacity:.55}.yja-panel-art.storm{background:linear-gradient(160deg,#75849b,#222d43)}.yja-panel-art.run{background:linear-gradient(135deg,#bac6d2,#657287)}.yja-panel-art.ferry{background:linear-gradient(160deg,#56677c,#d2d9e0)}.yja-panel-art.watch{background:radial-gradient(circle at 50% 50%,#eadfb9 0 18%,#606a7b 19% 21%,#c5ced8 22%)}.yja-panel-art.memory{background:linear-gradient(145deg,#dbcba6,#907b62)}.yja-panel-art.turn{background:linear-gradient(135deg,#8797aa,#d9cdb2)}.yja-panel-art.clock{background:repeating-radial-gradient(circle at 40% 45%,#b99454 0 5px,#394154 6px 11px)}.yja-panel-art.dawn{background:linear-gradient(160deg,#ffe6b8,#a9c9dc 58%,#5b7186)}.yja-panel-art b{position:relative;z-index:1;display:inline-grid;place-items:center;width:21px;height:21px;border-radius:50%;background:#272e3d;color:#fff;font-size:9px}.yja-panel-art p{position:relative;z-index:1;margin:28px 0 0;padding:6px;border-radius:6px;background:rgba(255,255,255,.78);font-size:9px;line-height:1.45}.yja-speech-list{margin-top:14px}.yja-speech-row{display:grid;grid-template-columns:72px 1fr 120px auto;gap:9px;align-items:center;margin-bottom:7px;padding:10px;border:1px solid rgba(119,126,151,.12);border-radius:12px;background:rgba(255,255,255,.76)}.yja-speech-row code{color:#7567d2;font-size:9px}.yja-speech-row p{margin:0;font-size:10px}.yja-speech-row select{height:30px;border:1px solid #dfe2ea;border-radius:8px;background:#fff;color:#525e70;font-size:10px}.yja-shot-map{display:grid;grid-template-columns:90px 1fr 95px;gap:10px;align-items:center;margin-bottom:8px;padding:11px;border:1px solid rgba(114,107,180,.13);border-radius:13px;background:linear-gradient(135deg,#fff,#f7f7fd)}.yja-shot-map strong{color:#6558c7;font-size:10px}.yja-shot-map p{margin:0;color:#657184;font-size:9px;line-height:1.5}.yja-shot-map span{font-size:9px;color:#8a94a6}.yja-correction{margin-top:10px;padding:11px;border:1px solid rgba(33,183,134,.2);border-radius:12px;background:#effaf6;color:#287d65;font-size:9px}
      [data-theme="dark"] .yja-mode-switch{background:#1c2639}[data-theme="dark"] .yja-manga-page{background:#202a3d}[data-theme="dark"] .yja-speech-row,[data-theme="dark"] .yja-shot-map{background:#1e293d}[data-theme="dark"] .yja-speech-row select{background:#151e2e;color:#dce4f0;border-color:#364157}[data-theme="dark"] .yja-speech-row p,[data-theme="dark"] .yja-shot-map p{color:#b2bdcf}[data-theme="dark"] .yja-correction{background:#19352f;color:#8ce0c5}
      body[data-yj-mode="normal"] .yja-grid{grid-template-columns:220px minmax(0,1fr)}body[data-yj-mode="normal"] .yja-evidence{display:none}
      @media(max-width:1100px){.yja-grid{grid-template-columns:210px minmax(0,1fr)}.yja-evidence{display:none}.yja-import{grid-template-columns:1fr}.yja-invariants,.yja-scenes{grid-template-columns:1fr 1fr}}
      @media(max-width:720px){.yja-shell{width:calc(100% - 18px)}.yja-top{align-items:flex-start;flex-direction:column}.yja-actions{justify-content:flex-start}.yja-grid,body[data-yj-mode="normal"] .yja-grid{grid-template-columns:1fr}.yja-stages{display:flex;overflow:auto}.yja-stage{min-width:170px}.yja-stage+.yja-stage:before{display:none}.yja-invariants,.yja-scenes,.yja-manga-pages{grid-template-columns:1fr}.yja-issue,.yja-speech-row,.yja-shot-map{grid-template-columns:1fr}.yja-compare{grid-template-columns:1fr}.yja-arrow{transform:rotate(90deg)}}
    `;
    document.head.appendChild(style);
  }

  function ensureDOM() {
    injectStyles();
    var root = document.getElementById('yj-page-adaptation');
    if (!root || root.dataset.ready) return root;
    root.dataset.ready = 'true';
    root.innerHTML = '<div class="yja-shell" id="yjaShell"></div>';
    root.addEventListener('click', handleClick);
    root.addEventListener('change', handleChange);
    return root;
  }

  function render() {
    var root = ensureDOM();
    if (!root) return;
    var shell = document.getElementById('yjaShell');
    var progress = Math.round((state.completed.length / stages().length) * 100);
    shell.innerHTML = topHTML() + (!state.loaded ? importHTML() : '<div class="yja-grid">' + stageRailHTML() + mainHTML(progress) + evidenceHTML() + '</div>');
  }

  function topHTML() {
    var isManga = state.mode === 'manga';
    return '<section class="yja-top"><div class="yja-title"><small>YUNJIANG ADAPTATION LAB · SCHEMA v1.3</small><h2>' + (isManga ? '🖼 漫画 IP 拆解工作台' : '🎞 文学 IP 改编工作台') + '</h2><p>' + (isManga ? '页格级视觉溯源 · 对白归属可校正 · 画格自动映射真人镜头' : '原著事实不可覆盖 · 故事骨架人工锁定 · 每次改编都有依据和影响范围') + '</p></div><div class="yja-actions"><div class="yja-mode-switch"><button data-yja="mode-literary" class="' + (!isManga?'active':'') + '">📖 文学拆解</button><button data-yja="mode-manga" class="' + (isManga?'active':'') + '">▦ 漫画拆解</button></div>' +
      (state.loaded ? '<span class="yja-save">● 已自动保存</span><button class="yja-btn" data-yja="reset">重置 Demo</button><button class="yja-btn" data-yja="export">导出拆解说明书</button><button class="yja-btn primary" id="yj-adapt-run" data-yja="run" ' + (state.running || state.checkpoint ? 'disabled' : '') + '>' + (state.completed.length === stages().length ? '✓ 已完成' : state.completed.length ? '继续运行' : '▶ 开始拆解') + '</button>' : '') +
      '</div></section>';
  }

  function importHTML() {
    var isManga = state.mode === 'manga';
    return '<section class="yja-import"><div class="yja-import-main"><h3>' + (isManga?'导入漫画样章，建立可回溯到页码与画格的视觉事实层':'导入一部文学作品，先建立“不可编造”的原著事实层') + '</h3><p>' + (isManga?'系统将识别页序、画格、对白框、说话人、角色动作和跨页事件，再转换为可拍镜头。':'支持小说、纪实文学和文章。系统会提取角色、世界、事件、关系与对白，并为每项结论保留原文出处。') + '</p><div class="yja-drop"><i>' + (isManga?'🖼':'📖') + '</i><div><b>' + (isManga?'拖入 PDF / CBZ / JPG / PNG':'拖入 TXT / Markdown / EPUB') + '</b><small>当前 MVP 使用预置样章，不上传、不消耗 Token</small></div></div><div class="yja-format-list">' + (isManga?'<span>画格切分</span><span>阅读序</span><span>对白 OCR</span><span>人物追踪</span><span>镜头映射</span>':'<span>章节切块</span><span>人物关系</span><span>事件因果</span><span>原文引用</span>') + '</div></div><aside class="yja-import-side"><b>开始前确认</b><label class="yja-rights"><input type="checkbox" id="yjaRights" checked><span>我确认拥有该作品的改编权、授权或作品属于可合法使用范围。</span></label><button class="yja-btn primary yja-sample" id="yj-adapt-load-demo" data-yja="load-demo">' + (isManga?'载入漫画样章《末班渡口》':'载入示例《灯影里的旧账》') + '</button></aside></section>';
  }

  function stageRailHTML() {
    var d = state.data, flow = stages(), isManga = state.mode === 'manga';
    return '<aside class="yja-panel"><div class="yja-panel-head"><b>' + (isManga?'漫画拆解流水线':'文学改编流水线') + '</b><small>' + flow.length + '阶段 · 2个人工检查点</small></div><div class="yja-stages">' + flow.map(function (s, i) {
      var cls = state.completed.indexOf(s.id) >= 0 ? 'done' : state.active === s.id ? 'active' : state.checkpoint === s.checkpoint ? 'waiting' : '';
      return '<div class="yja-stage ' + cls + '" data-stage="' + s.id + '"><span class="num">' + String(i + 1).padStart(2,'0') + '</span><div><b>' + esc(s.label) + '</b><small>' + esc(s.agent) + '</small></div><i class="dot"></i></div>';
    }).join('') + '</div><div class="yja-source-card"><b>' + esc(d.settings.source_name) + '</b><span>' + esc(d.settings.source_author) + ' · 改编为 ' + d.settings.target_episode_count + ' 集短剧</span><div class="yja-source-stats"><em><strong>' + (isManga?d.settings.total_pages:d.settings.total_chapters) + '</strong>' + (isManga?'页':'章节') + '</em><em><strong>' + (isManga?d.settings.total_panels:d.settings.total_chunks) + '</strong>' + (isManga?'画格':'分块') + '</em><em><strong>' + d.characters.length + '</strong>角色</em></div></div></aside>';
  }

  function mainHTML(progress) {
    var flow=stages(), current = flow.find(function (s) { return s.id === state.active; }) || flow[Math.min(state.completed.length, flow.length - 1)];
    var statusText = state.checkpoint ? '等待人工确认' : state.running ? '正在执行' : state.completed.length === flow.length ? '改编闭环已完成' : '已就绪';
    return '<main class="yja-panel yja-main"><div class="yja-status"><div class="yja-status-copy"><span class="yja-agent-orb">' + (state.checkpoint ? '✋' : state.completed.length === flow.length ? '✓' : '✦') + '</span><div><b>' + esc(statusText) + '</b><small>' + esc(current.agent) + ' · ' + esc(current.skill) + '</small></div></div><div class="yja-progress"><span><em>' + state.completed.length + ' / ' + flow.length + '</em><em>' + progress + '%</em></span><i style="--progress:' + progress + '%"></i></div></div>' + tabsHTML() + '<div class="yja-content">' + contentHTML() + '</div></main>';
  }

  function tabsHTML() {
    var tabs = state.mode === 'manga' ? [['panels','画格与对白'],['source','故事骨架'],['diagnosis','影视化诊断'],['proposal','镜头改编'],['scenes','分场交付']] : [['source','原著骨架'],['diagnosis','影视化诊断'],['proposal','改编对照'],['scenes','分场交付']];
    return '<nav class="yja-tabs">' + tabs.map(function (t) { return '<button class="yja-tab ' + (state.tab === t[0] ? 'active' : '') + '" data-yja-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav>';
  }

  function contentHTML() {
    if (state.tab === 'panels' && state.mode === 'manga') return mangaPanelsHTML();
    if (state.tab === 'diagnosis') return diagnosisHTML();
    if (state.tab === 'proposal') return proposalHTML();
    if (state.tab === 'scenes') return scenesHTML();
    return sourceHTML();
  }

  function mangaPanelsHTML() {
    var d=state.data;
    var pages=d.pages.map(function(page){
      var panels=d.panels.filter(function(panel){return panel.page===page.no;});
      return '<article class="yja-manga-page"><header><span>PAGE '+String(page.no).padStart(2,'0')+'</span><span>LTR · '+panels.length+'格</span></header>'+panels.map(function(panel){return '<div class="yja-panel-art '+esc(panel.tone)+'"><b>'+panel.order+'</b><p>'+esc(panel.scene)+'</p></div>';}).join('')+'</article>';
    }).join('');
    var speech=d.speech.map(function(line){return '<article class="yja-speech-row"><code>'+esc(line.panel)+'</code><p>“'+esc(line.content)+'”</p><select data-manga-speaker="'+line.id+'"><option '+(line.speaker==='许知遥'?'selected':'')+'>许知遥</option><option '+(line.speaker==='罗伯'?'selected':'')+'>罗伯</option><option '+(line.speaker==='父亲'?'selected':'')+'>父亲</option><option>旁白</option></select><span class="yja-chip '+(line.corrected?'good':line.confidence<90?'warn':'')+'">'+(line.corrected?'人工校正':line.confidence+'%')+'</span></article>';}).join('');
    return '<div class="yja-section-title"><div><h3>漫画页与阅读顺序</h3><p>每项视觉事实保留页码、画格编号和识别置信度。</p></div><span class="yja-chip">'+d.panels.length+' 个画格</span></div><div class="yja-manga-pages">'+pages+'</div><div class="yja-section-title" style="margin-top:18px"><div><h3>对白框与说话人</h3><p>低置信度归属可人工修正，修改会进入 Agent Run 证据。</p></div><span class="yja-chip warn">1 项待复核</span></div><div class="yja-speech-list">'+speech+'</div><div class="yja-correction">✓ 阅读方向：从左至右 · 页序 1→3 · 所有画格均已建立 pgXX#pXX 溯源索引</div>';
  }

  function sourceHTML() {
    var d = state.data;
    return '<div class="yja-section-title"><div><h3>原著骨架与因果节拍</h3><p>紫色引用可回溯原文分块；锁定项不会被后续 Agent 覆盖。</p></div><span class="yja-chip">' + d.beats.length + ' 个剧情节拍</span></div><div class="yja-invariants">' + d.invariants.map(function (x) {
      return '<article class="yja-invariant ' + (x.approved ? 'approved' : '') + '"><header><span class="yja-chip">' + esc(x.type) + '</span><span class="yja-chip ' + (x.approved ? 'good' : 'warn') + '">' + (x.approved ? '已锁定' : x.lock) + '</span></header><b>' + esc(x.title) + '</b><p>' + esc(x.description) + '</p><footer><span>' + esc(x.sources.join(' · ')) + '</span><span>' + (x.approved ? '✓ HUMAN' : '待确认') + '</span></footer></article>';
    }).join('') + '</div><div class="yja-timeline">' + d.beats.map(function (b) { return '<article class="yja-beat"><div><b>' + b.no + '. ' + esc(b.title) + '</b><small>' + esc(b.fn) + ' · <span class="yja-source-link">' + esc(b.sources.join(' / ')) + '</span></small></div><span class="yja-chip ' + (b.policy === '保留' ? 'good' : 'warn') + '">' + esc(b.policy) + '</span></article>'; }).join('') + '</div>' + (state.checkpoint === 'skeleton' ? checkpointHTML('skeleton') : '');
  }

  function diagnosisHTML() {
    var d = state.data;
    return '<div class="yja-section-title"><div><h3>不能直接影视化的情节</h3><p>问题只作用于改编决策层，不修改原著事实。</p></div><span class="yja-chip warn">' + d.issues.length + ' 项待优化</span></div>' + d.issues.map(function (x) { return '<article class="yja-issue"><div class="quote">“' + esc(x.excerpt) + '”<br><span class="yja-source-link">↗ ' + esc(x.sources.join(' / ')) + '</span></div><div><b>' + esc(x.title) + '</b><p>' + esc(x.diagnosis) + '</p><div class="yja-issue-tags"><span class="yja-chip danger">' + esc(x.severity) + '风险</span><span class="yja-chip">' + esc(x.type) + '</span><span class="yja-chip good">' + esc(x.value) + '</span></div></div><span class="yja-chip warn">OPEN</span></article>'; }).join('');
  }

  function proposalHTML() {
    var d = state.data;
    var mappings = state.mode === 'manga' ? '<div class="yja-section-title" style="margin-top:16px"><div><h3>画格 → 真人镜头映射</h3><p>不是照搬漫画构图，而是保留叙事功能后转换为可拍调度。</p></div><span class="yja-chip good">'+d.shots.length+' 组映射</span></div>'+d.shots.map(function(s){return '<article class="yja-shot-map"><strong>'+esc(s.panels.join(' + '))+'<br>→ '+esc(s.scene)+'</strong><p>'+esc(s.note)+'</p><span>'+esc(s.shot)+'<br>'+esc(s.move)+'</span></article>';}).join('') : '';
    return '<div class="yja-section-title"><div><h3>' + (state.mode==='manga'?'漫画与真人化方案对照':'原文与改编方案对照') + '</h3><p>每个方案说明改动理由、骨架影响和人工选择状态。</p></div><span class="yja-chip good">最小改动原则</span></div>' + d.proposals.map(function (p) { return '<article class="yja-proposal"><div class="yja-proposal-head"><label><input type="checkbox" data-proposal="' + p.id + '" ' + (p.selected ? 'checked' : '') + '> ' + esc(p.strategy) + '</label><span class="yja-chip ' + (p.status === 'passed' ? 'good' : 'warn') + '">' + esc(p.impact) + '</span></div><div class="yja-compare"><div class="yja-copy"><small>'+(state.mode==='manga'?'漫画表达':'原文情节')+'</small><p>' + esc(p.original) + '</p></div><div class="yja-arrow">→</div><div class="yja-copy new"><small>影视化改编</small><p>' + esc(p.adapted) + '</p></div></div><div class="yja-proposal-foot"><span>理由：' + esc(p.rationale) + '</span><span>' + (p.selected ? '✓ 已选择' : '未选择') + '</span></div></article>'; }).join('') + mappings + (state.checkpoint === 'proposal' ? checkpointHTML('proposal') : '');
  }

  function scenesHTML() {
    var d = state.data;
    if (state.completed.indexOf('delivery') < 0) return '<div class="yja-empty"><div><i>🎬</i><b>分场交付将在一致性复核后生成</b><p>先完成故事骨架与改编方案两个检查点，知识校验官确认骨架守恒后才会开放下游成果。</p></div></div>';
    return '<div class="yja-section-title"><div><h3>核心分场大纲</h3><p>所有场次都关联源事件，并附带可拍动作和冲突目标。</p></div><span class="yja-chip good">VALIDATED</span></div><div class="yja-scenes">' + d.scenes.map(function (s) { return '<article class="yja-scene"><header><span>EP ' + s.ep + ' · SC ' + s.scene + '</span><span>可拍</span></header><h4>' + esc(s.location) + '</h4><dl><dt>戏剧目标</dt><dd>' + esc(s.goal) + '</dd><dt>核心冲突</dt><dd>' + esc(s.conflict) + '</dd><dt>视觉动作</dt><dd>' + esc(s.visual) + '</dd></dl></article>'; }).join('') + '</div><div class="yja-checkpoint" style="margin-top:12px"><h4>✓ 改编一致性验证通过</h4><p>3项故事骨架全部保留，3项影视化问题均有变更依据，未发现角色动机断裂或因果链断裂。</p><div class="yja-checkpoint-actions"><button class="yja-btn success" data-yja="export">导出改编说明书</button></div></div>';
  }

  function checkpointHTML(type) {
    if (type === 'skeleton') return '<section class="yja-checkpoint" id="yj-adapt-skeleton-checkpoint"><h4>✋ 检查点 1 · 锁定故事骨架</h4><p>请确认主题、关键因果与主角选择不可被后续改编覆盖。确认后系统才会开始影视化诊断。</p><div class="yja-checkpoint-actions"><button class="yja-btn success" id="yj-adapt-approve-skeleton" data-yja="approve-skeleton">确认并锁定 3 项骨架</button><button class="yja-btn" data-yja="pause">保存并稍后继续</button></div></section>';
    return '<section class="yja-checkpoint" id="yj-adapt-proposal-checkpoint"><h4>✋ 检查点 2 · 选择改编方向</h4><p>已选择 ' + state.data.proposals.filter(function(p){return p.selected;}).length + ' 项方案。确认后将执行骨架守恒、角色一致性和现代价值复核。</p><div class="yja-checkpoint-actions"><button class="yja-btn success" id="yj-adapt-approve-proposals" data-yja="approve-proposals">批准所选方案并继续</button><button class="yja-btn" data-yja="pause">保存并稍后继续</button></div></section>';
  }

  function evidenceHTML() {
    var flow=stages(), current = flow.find(function (s) { return s.id === state.active; }) || flow[Math.min(state.completed.length, flow.length - 1)];
    var traceCount = state.data.characters.length + state.data.events.length + state.data.invariants.length + state.data.issues.length + (state.mode==='manga'?state.data.panels.length+state.data.speech.length:0);
    return '<aside class="yja-panel yja-evidence"><div class="yja-panel-head"><b>Agent Run 改编证据</b><small>专家、Skill、检查与人工决定</small></div><div class="yja-metrics"><div class="yja-metric"><b>' + state.completed.length + '</b>阶段</div><div class="yja-metric"><b>' + traceCount + '</b>引用</div><div class="yja-metric"><b>' + state.logs.filter(function(l){return l.kind==='human';}).length + '</b>人工决定</div></div><div class="yja-live ' + (state.running ? 'running' : '') + '"><small>' + (state.running ? 'LIVE EXECUTION' : state.checkpoint ? 'HUMAN CHECKPOINT' : 'CURRENT CONTEXT') + '</small><b>' + esc(current.agent) + '</b><span>' + esc(current.skill) + ' · v1.0.0</span></div><div class="yja-logs" id="yj-adapt-evidence-log">' + (state.logs.length ? state.logs.slice().reverse().map(function(l){return '<article class="yja-log ' + esc(l.kind) + '"><time>' + esc(l.time) + '</time><b>' + esc(l.title) + '</b><p>' + esc(l.detail) + '</p></article>';}).join('') : '<article class="yja-log"><b>等待任务启动</b><p>载入示例后点击“开始拆解”。</p></article>') + '</div></aside>';
  }

  function addLog(kind, title, detail) {
    state.logs.push({ kind: kind || '', title: title, detail: detail, time: new Date().toLocaleTimeString('zh-CN',{hour12:false}) });
    if (state.logs.length > 50) state.logs = state.logs.slice(-50);
  }

  function loadDemo() {
    var rights = document.getElementById('yjaRights');
    if (rights && !rights.checked) { notify('请先确认作品权利状态'); return; }
    var mode=state.mode;
    state = freshState(); state.mode=mode; state.loaded = true; state.data = clone(mode==='manga'?MANGA_DEMO:DEMO); state.tab = mode==='manga'?'panels':'source';
    addLog('done',mode==='manga'?'漫画样章已载入':'示例项目已载入',mode==='manga'?'3页、8个画格和3条对白已准备，整个演示为零 Token 本地运行。':'6个原文分块已准备，整个演示为零 Token 本地运行。'); saveState(); render();
  }

  function resetDemo() { if (!confirm('重置改编 Demo？当前检查点和选择将被清除。')) return; localStorage.removeItem(STORAGE_KEY); state = freshState(); render(); }

  async function runPipeline() {
    var flow=stages();
    if (state.running || state.checkpoint || state.completed.length === flow.length) return;
    state.running = true; render();
    for (var i = state.completed.length; i < flow.length; i++) {
      var stage = flow[i];
      state.active = stage.id; addLog('',stage.agent + ' 开始执行',stage.skill + ' · 检查：' + stage.checks.join('、')); saveState(); render();
      await wait(460);
      if (stage.checkpoint === 'skeleton' && !state.skeletonApproved) {
        state.running = false; state.checkpoint = 'skeleton'; state.tab = 'source'; addLog('human','等待骨架确认','3项不可变故事骨架需要人工锁定。'); saveState(); render(); return;
      }
      if (stage.checkpoint === 'proposal' && !state.proposalApproved) {
        state.running = false; state.checkpoint = 'proposal'; state.tab = 'proposal'; addLog('human','等待方案确认','请选择并批准可进入下游的改编方案。'); saveState(); render(); return;
      }
      if (state.completed.indexOf(stage.id) < 0) state.completed.push(stage.id);
      addLog('done',stage.label + ' 已完成',stage.checks.length + '项检查通过，产物已写入改编知识库。'); saveState(); render();
      await wait(180);
    }
    state.running = false; state.active = 'delivery'; state.tab = 'scenes';
    addLog('done',state.mode==='manga'?'漫画拆解与改编交付完成':'改编工作台交付完成',state.mode==='manga'?'页格溯源、角色连续、骨架守恒和镜头可拍性均已通过。':'骨架守恒、现代价值与分场可拍性均已通过。'); saveState(); render(); notify(state.mode==='manga'?'漫画拆解 Demo 已完成，可查看镜头映射与分场交付':'改编 Demo 已完成，可查看分场交付与变更证据');
  }

  function approveSkeleton() {
    state.data.invariants.forEach(function(x){x.approved=true;}); state.skeletonApproved = true; state.checkpoint = '';
    if (state.completed.indexOf('skeleton_lock') < 0) state.completed.push('skeleton_lock');
    addLog('human','人工锁定故事骨架','主题、关键因果和主角选择共3项已批准。'); saveState(); render(); setTimeout(runPipeline,220);
  }

  function approveProposals() {
    var selected = state.data.proposals.filter(function(p){return p.selected;});
    if (!selected.length) { notify('至少选择一个改编方案'); return; }
    selected.forEach(function(p){p.status='passed';}); state.proposalApproved = true; state.checkpoint = '';
    if (state.completed.indexOf('proposal') < 0) state.completed.push('proposal');
    addLog('human','人工批准改编方向','已批准' + selected.length + '项方案，写入 change_ledger。'); saveState(); render(); setTimeout(runPipeline,220);
  }

  function exportReport() {
    if (!state.loaded) return;
    var d = state.data;
    var lines = ['# 云匠' + (state.mode==='manga'?'漫画 IP 拆解与改编说明书':'文学 IP 改编说明书'),'', '原作：' + d.settings.source_name,'目标：' + d.settings.target_episode_count + '集短剧'];
    if(state.mode==='manga'){lines.push('','## 页格事实层');d.panels.forEach(function(p){lines.push('- pg'+String(p.page).padStart(2,'0')+'#'+p.id+'：'+p.scene);});lines.push('','## 对白归属');d.speech.forEach(function(s){lines.push('- '+s.panel+'｜'+s.speaker+'：'+s.content+(s.corrected?'（人工校正）':''));});}
    lines.push('','## 不可变故事骨架');
    d.invariants.forEach(function(x){lines.push('- [' + (x.approved?'已锁定':'待确认') + '] ' + x.title + '：' + x.description + '（' + x.sources.join('/') + '）');});
    lines.push('','## 影视化改编台账'); d.proposals.filter(function(p){return p.selected;}).forEach(function(p){lines.push('','### ' + p.strategy,'- 原文：' + p.original,'- 改编：' + p.adapted,'- 理由：' + p.rationale,'- 骨架影响：' + p.impact);});
    lines.push('','## 分场交付'); d.scenes.forEach(function(s){lines.push('- EP' + s.ep + '-SC' + s.scene + '｜' + s.location + '｜' + s.goal + '｜视觉：' + s.visual);});
    var blob = new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='云匠-' + d.settings.source_name.replace(/[《》]/g,'') + '-拆解改编说明书.md'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); addLog('human','导出拆解说明书','已导出事实层、骨架、方案、依据和分场成果。'); saveState(); render();
  }

  function handleClick(e) {
    var tab = e.target.closest('[data-yja-tab]'); if (tab) { state.tab = tab.dataset.yjaTab; saveState(); render(); return; }
    var button = e.target.closest('[data-yja]'); if (!button) return;
    var action = button.dataset.yja;
    if (action === 'mode-literary' || action === 'mode-manga') switchMode(action==='mode-manga'?'manga':'literary'); else if (action === 'load-demo') loadDemo(); else if (action === 'run') runPipeline(); else if (action === 'approve-skeleton') approveSkeleton(); else if (action === 'approve-proposals') approveProposals(); else if (action === 'reset') resetDemo(); else if (action === 'export') exportReport(); else if (action === 'pause') notify('进度已保存，刷新或稍后返回可继续');
  }

  function switchMode(mode){
    if(state.running)return;
    if(state.loaded && state.mode!==mode && !confirm('切换拆解模式会保存当前进度，并打开另一种工作台。继续吗？'))return;
    var savedMode=mode; state=freshState(); state.mode=savedMode; saveState(); render();
  }

  function handleChange(e) {
    if(e.target.matches('[data-manga-speaker]')){
      var line=state.data.speech.find(function(x){return x.id===e.target.dataset.mangaSpeaker;});
      if(line){line.speaker=e.target.value;line.corrected=true;line.confidence=100;addLog('human','人工校正对白归属',line.panel+' 的对白已确认由“'+line.speaker+'”说出。');saveState();render();notify('说话人校正已写入证据日志');} return;
    }
    if (!e.target.matches('[data-proposal]')) return;
    var proposal = state.data.proposals.find(function(p){return p.id===e.target.dataset.proposal;}); if (proposal) proposal.selected=e.target.checked; saveState(); render();
  }

  function notify(message) {
    if (typeof window.showToast === 'function') { window.showToast(message); return; }
    var toast = document.getElementById('yj-toast'); if (toast) { toast.textContent=message; toast.classList.add('yj-toast-show'); setTimeout(function(){toast.classList.remove('yj-toast-show');},2200); }
  }
  function wait(ms) { return new Promise(function(resolve){setTimeout(resolve,ms);}); }

  window.YJAdaptationWorkbench = {
    open: function(){ render(); },
    reset: function(){ localStorage.removeItem(STORAGE_KEY); state=freshState(); render(); },
    getState: function(){ return clone(state); },
    setMode:function(mode){switchMode(mode==='manga'?'manga':'literary');},
    runDemoInstant: async function(mode){ if(mode && state.mode!==mode)switchMode(mode); if(!state.loaded) loadDemo(); while(state.completed.length<stages().length){ if(state.checkpoint==='skeleton') approveSkeleton(); else if(state.checkpoint==='proposal') approveProposals(); else await runPipeline(); await wait(20); } return clone(state); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(ensureDOM,0); }); else setTimeout(ensureDOM,0);
})();
