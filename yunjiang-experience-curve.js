/**
 * 云匠引擎 · 体验曲线可视化模块
 * 六维雷达图：悬念张力 / 情感共鸣 / 新奇冲击 / 爽感释放 / 沉浸深度 / 角色认同
 * 纯SVG实现，无外部依赖
 */
(function() {
  'use strict';

  const DIMENSIONS = [
    { key: 'suspense',    label: '悬念张力' },
    { key: 'emotion',     label: '情感共鸣' },
    { key: 'novelty',     label: '新奇冲击' },
    { key: 'thrill',      label: '爽感释放' },
    { key: 'immersion',   label: '沉浸深度' },
    { key: 'attachment',  label: '角色认同' },
  ];

  const COLORS = {
    fill: 'rgba(139,92,246,0.18)',
    stroke: '#8b5cf6',
    dot: '#6d28d9',
    grid: 'rgba(148,163,184,0.25)',
    gridBold: 'rgba(100,116,139,0.4)',
    label: '#475569',
    bg: 'rgba(255,255,255,0.6)',
    bgDark: 'rgba(15,23,42,0.5)',
    labelDark: '#cbd5e1',
  };

  /**
   * 生成SVG雷达图
   * @param {Object} data - { episode: number, scores: { suspense: 72, emotion: 85, ... } }
   * @param {Object} opts - { size, containerId, title }
   * @returns {string} SVG HTML string
   */
  function radarChart(data, opts = {}) {
    const size = opts.size || 280;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.38;
    const levels = 5;
    const n = DIMENSIONS.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2; // 从顶部开始

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    function polarToXY(angle, radius) {
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    }

    // 构建网格
    let gridLines = '';
    for (let lv = 1; lv <= levels; lv++) {
      const r = (maxR / levels) * lv;
      let points = [];
      for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const p = polarToXY(angle, r);
        points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }
      gridLines += `<polygon points="${points.join(' ')}" fill="none" stroke="${lv === levels ? COLORS.gridBold : COLORS.grid}" stroke-width="${lv === levels ? 1.2 : 0.8}" />`;
    }

    // 轴线
    let axisLines = '';
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const p = polarToXY(angle, maxR);
      axisLines += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${COLORS.grid}" stroke-width="0.6" />`;
    }

    // 数据多边形
    const scores = data.scores || {};
    let dataPoints = [];
    let dots = '';
    for (let i = 0; i < n; i++) {
      const dim = DIMENSIONS[i];
      const val = Math.min(100, Math.max(0, scores[dim.key] || 0));
      const r = (val / 100) * maxR;
      const angle = startAngle + i * angleStep;
      const p = polarToXY(angle, r);
      dataPoints.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${COLORS.dot}" stroke="white" stroke-width="1.5" class="radar-dot" data-dim="${dim.key}" data-val="${val}" />`;
    }

    // 标签
    let labels = '';
    const labelOffset = maxR + 24;
    for (let i = 0; i < n; i++) {
      const dim = DIMENSIONS[i];
      const angle = startAngle + i * angleStep;
      const p = polarToXY(angle, labelOffset);
      const val = Math.min(100, Math.max(0, scores[dim.key] || 0));
      let anchor = 'middle';
      if (Math.abs(angle - (-Math.PI/2)) < 0.1) anchor = 'middle';
      else if (Math.cos(angle) > 0.1) anchor = 'start';
      else if (Math.cos(angle) < -0.1) anchor = 'end';

      const labelColor = isDark ? COLORS.labelDark : COLORS.label;
      labels += `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" font-size="11" fill="${labelColor}" font-weight="500">${dim.label}</text>`;
      labels += `<text x="${p.x.toFixed(1)}" y="${(p.y + 14).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" font-size="10" fill="${COLORS.stroke}" font-weight="600">${val}</text>`;
    }

    const bgColor = isDark ? COLORS.bgDark : COLORS.bg;
    const title = opts.title || `第${data.episode || 1}集 · 体验曲线`;

    return `
    <div class="experience-curve-card" style="background:${bgColor};backdrop-filter:blur(16px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.3);box-shadow:inset 0 1px 1px rgba(255,255,255,0.2);">
      <div style="text-align:center;font-size:14px;font-weight:600;color:${isDark ? '#e2e8f0' : '#1e293b'};margin-bottom:12px;">${title}</div>
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;margin:0 auto;">
        ${gridLines}
        ${axisLines}
        <polygon points="${dataPoints.join(' ')}" fill="${COLORS.fill}" stroke="${COLORS.stroke}" stroke-width="2" stroke-linejoin="round">
          <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
        </polygon>
        ${dots}
        ${labels}
      </svg>
      <div style="display:flex;justify-content:center;gap:16px;margin-top:8px;flex-wrap:wrap;">
        ${DIMENSIONS.map(d => {
          const v = Math.min(100, Math.max(0, scores[d.key] || 0));
          const barColor = v >= 80 ? '#22c55e' : v >= 60 ? '#8b5cf6' : v >= 40 ? '#f59e0b' : '#ef4444';
          return `<div style="text-align:center;min-width:60px;">
            <div style="font-size:10px;color:${isDark ? '#94a3b8' : '#64748b'};">${d.label}</div>
            <div style="height:4px;background:${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};border-radius:2px;margin:4px 0;overflow:hidden;">
              <div style="height:100%;width:${v}%;background:${barColor};border-radius:2px;transition:width 0.8s ease;"></div>
            </div>
            <div style="font-size:11px;font-weight:600;color:${barColor};">${v}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  /**
   * 生成多集体验曲线趋势图（折线）
   * @param {Array} episodes - [{ episode: 1, scores: {...} }, ...]
   * @param {Object} opts - { size, title }
   * @returns {string} SVG HTML string
   */
  function trendChart(episodes, opts = {}) {
    if (!episodes || episodes.length < 1) return '';
    const size = opts.size || { w: 560, h: 280 };
    const w = size.w, h = size.h;
    const pad = { top: 30, right: 80, bottom: 36, left: 40 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const title = opts.title || '体验曲线趋势';

    const dimColors = ['#8b5cf6','#6366f1','#ec4899','#f59e0b','#22c55e','#06b6d4'];

    // X轴：集数
    const epCount = episodes.length;
    const xStep = epCount > 1 ? chartW / (epCount - 1) : chartW / 2;

    // 网格线
    let gridSvg = '';
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + chartH - (chartH / 5) * i;
      const val = i * 20;
      gridSvg += `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}" stroke-width="0.8" />`;
      gridSvg += `<text x="${pad.left - 8}" y="${y + 3}" text-anchor="end" font-size="9" fill="${isDark ? '#64748b' : '#94a3b8'}">${val}</text>`;
    }

    // X轴标签
    for (let i = 0; i < epCount; i++) {
      const x = pad.left + i * xStep;
      gridSvg += `<text x="${x}" y="${h - 8}" text-anchor="middle" font-size="10" fill="${isDark ? '#94a3b8' : '#64748b'}">第${episodes[i].episode}集</text>`;
    }

    // 每个维度一条线
    let linesSvg = '';
    DIMENSIONS.forEach((dim, di) => {
      const color = dimColors[di % dimColors.length];
      let points = [];
      let dots = '';
      episodes.forEach((ep, ei) => {
        const val = Math.min(100, Math.max(0, (ep.scores || {})[dim.key] || 0));
        const x = pad.left + ei * xStep;
        const y = pad.top + chartH - (val / 100) * chartH;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${color}" stroke="white" stroke-width="1" />`;
      });
      linesSvg += `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.85" />`;
      linesSvg += dots;
    });

    // 图例
    let legendSvg = '';
    const legendX = w - pad.right + 12;
    DIMENSIONS.forEach((dim, di) => {
      const color = dimColors[di % dimColors.length];
      const ly = pad.top + 6 + di * 18;
      legendSvg += `<rect x="${legendX}" y="${ly - 5}" width="10" height="10" rx="2" fill="${color}" opacity="0.85" />`;
      legendSvg += `<text x="${legendX + 14}" y="${ly + 3}" font-size="9" fill="${isDark ? '#cbd5e1' : '#475569'}">${dim.label}</text>`;
    });

    const bgColor = isDark ? COLORS.bgDark : COLORS.bg;

    return `
    <div class="experience-curve-card" style="background:${bgColor};backdrop-filter:blur(16px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.3);box-shadow:inset 0 1px 1px rgba(255,255,255,0.2);">
      <div style="text-align:center;font-size:14px;font-weight:600;color:${isDark ? '#e2e8f0' : '#1e293b'};margin-bottom:12px;">${title}</div>
      <svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;max-width:${w}px;margin:0 auto;">
        ${gridSvg}
        ${linesSvg}
        ${legendSvg}
      </svg>
    </div>`;
  }

  /**
   * 根据剧本内容自动分析六维数据（基于规则引擎的轻量启发式分析）
   * @param {string} episodeContent - 分集剧本文本
   * @param {number} episodeNum - 集数
   * @returns {Object} { episode, scores }
   */
  function analyzeEpisode(episodeContent, episodeNum) {
    const text = episodeContent || '';
    const len = text.length;

    // 悬念张力：问号、省略号、"悬念"、"秘密"、"没想到"、反转类词频
    const suspenseWords = (text.match(/[？?]|[…]{2,}|悬念|秘密|没想到|竟然|不料|反转|悬念|危机|紧迫|倒计时/g) || []).length;
    const suspense = Math.min(100, 40 + suspenseWords * 6 + (episodeNum > 1 ? 10 : 0));

    // 情感共鸣：情感类词频
    const emotionWords = (text.match(/感动|眼泪|心痛|温暖|拥抱|深情|告白|离别|重逢|牵挂|思念|愧疚|勇气|希望/g) || []).length;
    const emotion = Math.min(100, 35 + emotionWords * 7);

    // 新奇冲击：新元素、场景转换、意外事件
    const noveltyWords = (text.match(/突然|意外|全新|从未|第一次|震撼|惊人|奇异|神秘|奇幻|穿越|觉醒|蜕变/g) || []).length;
    const novelty = Math.min(100, 30 + noveltyWords * 8 + (episodeNum === 1 ? 15 : 0));

    // 爽感释放：爽点类词频
    const thrillWords = (text.match(/爽|赢|胜|逆袭|打脸|碾压|实力|觉醒|爆发|强势|霸气|惊艳|震撼|逆袭/g) || []).length;
    const thrill = Math.min(100, 25 + thrillWords * 7);

    // 沉浸深度：细节描写密度（场景、五感、环境）
    const immersionWords = (text.match(/阳光|风|雨|夜|灯|声|影|气息|温度|触感|色彩|味道|街道|房间|窗外|月光|星/g) || []).length;
    const immersion = Math.min(100, 30 + immersionWords * 5);

    // 角色认同：角色心理描写、对话密度
    const dialogCount = (text.match(/[""「」]/g) || []).length / 2;
    const psychWords = (text.match(/心想|暗想|内心|决定|发誓|犹豫|坚定|挣扎|成长|领悟|明白/g) || []).length;
    const attachment = Math.min(100, 30 + dialogCount * 2 + psychWords * 6);

    return {
      episode: episodeNum,
      scores: {
        suspense: Math.round(suspense),
        emotion: Math.round(emotion),
        novelty: Math.round(novelty),
        thrill: Math.round(thrill),
        immersion: Math.round(immersion),
        attachment: Math.round(attachment),
      }
    };
  }

  /**
   * 渲染体验曲线到指定容器
   * @param {string} containerId - 目标容器DOM ID
   * @param {Array} episodes - 剧集数据
   */
  function render(containerId, episodes) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center;padding:16px 0;">';

    // 每集雷达图
    episodes.forEach(ep => {
      html += radarChart(ep, { size: 260 });
    });

    html += '</div>';

    // 多集趋势图（仅当集数>1时）
    if (episodes.length > 1) {
      html += '<div style="padding:16px 0;">' + trendChart(episodes, { size: { w: 600, h: 300 } }) + '</div>';
    }

    container.innerHTML = html;
  }

  // 暴露到全局
  window.YunjiangExperienceCurve = {
    DIMENSIONS,
    radarChart,
    trendChart,
    analyzeEpisode,
    render,
  };

})();
