import { chromium } from 'file:///C:/Users/13306/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.YJ_STATIC_URL || 'http://127.0.0.1:8892';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => {
  // Simulate the explicit backend override used by a static GitHub Pages host.
  window.YJ_ENGINE_API_BASE = 'https://reasonable-magic-production-7faf.up.railway.app';
});
const errors = [];
const localHttpErrors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.url().startsWith(base) && response.status() >= 400) {
    localHttpErrors.push({ url: response.url(), status: response.status() });
  }
});

await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof window.enterStudio === 'function', null, { timeout: 120000 });
await page.waitForTimeout(500);
const checks = {
  title: (await page.title()).includes('云匠'),
  loginPage: await page.locator('#onboardingScreen').isVisible().catch(() => false),
  apiBaseNotGitHubPages: await page.evaluate(() => !String(window.YJBackendBridge?.base || '').includes('github.io')),
};
await page.locator('#creatorName').fill('静态页验收');
await page.evaluate(() => window.enterStudio());
await page.waitForTimeout(100);
checks.projectCenter = await page.locator('#yj-project-root').isVisible().catch(() => false);
checks.home = await page.locator('#yj-page-home.yj-page-active').isVisible().catch(() => false);
checks.quickDemoButton = await page.locator('#yj-home-demo').isVisible().catch(() => false);
checks.defaultAutoMode = await page.locator('body').getAttribute('data-yj-mode').then(mode => mode === 'normal');
checks.modeToggleAccessible = await page.locator('#yj-mode-toggle[role="group"] .yj-mode-btn[aria-pressed="true"]:visible').count().then(count => count === 1);
await page.locator('#yj-home-start').click();
await page.waitForTimeout(80);
checks.autoModeMinimalCreate = await page.locator('#yj-new-project-title').innerText().then(text => text.includes('快速新建'));
checks.autoConfigVisible = await page.locator('#yj-auto-config-card').isVisible().catch(() => false);
checks.proConfigHiddenInAuto = await page.locator('#yj-pro-project-fields').isHidden().catch(() => false);
await page.locator('#yj-modal-cancel').click();
await page.locator('.yj-mode-btn[data-mode="pro"]:visible').click();
await page.waitForTimeout(80);
checks.proModeApplied = await page.locator('body').getAttribute('data-yj-mode').then(mode => mode === 'pro');
checks.proModePersisted = await page.evaluate(() => localStorage.getItem('yj_display_mode') === 'pro');
await page.locator('#yj-home-start').click();
await page.waitForTimeout(80);
checks.proModeAdvancedCreate = await page.locator('#yj-new-project-title').innerText().then(text => text.includes('专业项目配置'));
checks.proConfigVisible = await page.locator('#yj-pro-project-fields').isVisible().catch(() => false);
checks.proHasSixAdvancedControls = await page.locator('#yj-pro-project-fields select').count().then(count => count === 5) && await page.locator('#yj-project-audience, #yj-project-constraints').count().then(count => count === 2);
await page.screenshot({ path: 'tests/mode-pro-create.png', fullPage: false });
await page.locator('#yj-modal-cancel').click();
await page.locator('.yj-mode-btn[data-mode="normal"]:visible').click();
await page.waitForTimeout(80);
checks.expertKnowledgeNav = await page.locator('[data-view="knowledge"]').innerText().then(text => text.includes('专家智库')).catch(() => false);
checks.duplicateCreateNavRemoved = await page.locator('[data-view="newproject"]').count().then(count => count === 0);
await page.locator('[data-view="knowledge"]').click();
await page.waitForTimeout(100);
checks.expertKnowledgePage = await page.locator('#yj-page-knowledge.yj-page-active').isVisible().catch(() => false);
checks.seventeenKnowledgeBindings = await page.locator('[data-knowledge-expert]').count().then(count => count === 17);
checks.knowledgeCardsReadOnly = await page.locator('[data-knowledge-expert] button, [data-knowledge-expert] a').count().then(count => count === 0);
await page.evaluate(() => document.querySelector('[data-expert="mission_commander"]')?.classList.add('working'));
await page.waitForTimeout(800);
checks.knowledgeDispatchPulse = await page.locator('[data-knowledge-expert="mission_commander"].working').count().then(count => count === 1);
await page.screenshot({ path: 'tests/expert-knowledge-showcase.png', fullPage: true });
await page.evaluate(() => document.querySelector('[data-expert="mission_commander"]')?.classList.remove('working'));
await page.locator('[data-view="home"]').click();
await page.waitForTimeout(100);
const messageMetrics = await page.evaluate(() => {
  const toast = document.getElementById('errorToast');
  const nav = document.getElementById('yj-navbar');
  if (!toast || !nav) return null;
  toast.textContent = '消息提示位置验收';
  toast.classList.add('show');
  const toastBox = toast.getBoundingClientRect();
  const navBox = nav.getBoundingClientRect();
  const toastZ = Number(getComputedStyle(toast).zIndex || 0);
  const navZ = Number(getComputedStyle(nav).zIndex || 0);
  toast.classList.remove('show');
  return { toastTop: toastBox.top, navBottom: navBox.bottom, toastZ, navZ };
});
checks.messageClearsNavbar = !!messageMetrics && messageMetrics.toastTop >= messageMetrics.navBottom + 8 && messageMetrics.toastZ > messageMetrics.navZ;
await page.locator('#yj-nav-account-btn').click();
await page.waitForTimeout(100);
checks.logoutReturnsLogin = await page.locator('#onboardingScreen').isVisible().catch(() => false);
await page.evaluate(() => window.enterStudio());
await page.waitForTimeout(100);
await page.evaluate(() => {
  const original = window.startQuickDemo;
  window.startQuickDemo = options => original({ ...(options || {}), instant: true });
});
await page.locator('#yj-home-demo').click();
await page.waitForSelector('#yj-page-quickdemo.yj-page-active', { timeout: 10000 });
await page.locator('#yj-demo-run').click();
await page.waitForFunction(() => window.__yjQuickDemoPromise, null, { timeout: 10000 });
await page.evaluate(() => window.__yjQuickDemoPromise);
checks.quickDemoEntersWorkspace = await page.locator('.app-container').isVisible().catch(() => false);
checks.coreRunnerComplete = await page.locator('#yj-core-demo-status').innerText().then(text => text.includes('运行完成')).catch(() => false);
checks.liveStripShowsFourOfFour = await page.locator('#alsCount').innerText().then(text => text.replace(/\s/g, '') === '4/4').catch(() => false);
checks.fourCoreOutputs = await page.locator('[data-demo-core]').count().then(count => count === 4);
checks.coreOutputNames = await page.locator('[data-demo-core] .output-title').allInnerTexts().then(titles => ['故事大纲','人物小传','集纲','正文剧本'].every(name => titles.some(title => title.includes(name))));
checks.zeroTokenDemo = await page.locator('#yj-core-demo-runner').innerText().then(text => text.includes('零 Token')).catch(() => false);
checks.broadcastComplete = await page.locator('#bcNode-outline.done, #bcNode-roles.done, #bcNode-episodes.done, #bcNode-script.done').count().then(count => count === 4);
checks.runEvidence = await page.locator('#runEvidencePanel').innerText().then(text => ['故事大纲','人物小传','集纲','正文剧本'].every(name => text.includes(name))).catch(() => false);
checks.coreExperts = await page.locator('#evidenceExperts').innerText().then(text => Number(text.trim()) >= 4).catch(() => false);
checks.workspaceBackButton = await page.locator('#yj-workspace-back-btn').isVisible().catch(() => false);
checks.autoModeHidesEngineeringSidebar = await page.locator('.right-sidebar').isHidden().catch(() => false);
checks.autoModeHidesEvidenceTrigger = await page.locator('#evidenceTrigger').isHidden().catch(() => false);
await page.screenshot({ path: 'tests/mode-auto-workspace.png', fullPage: false });
await page.locator('.yj-mode-btn[data-mode="pro"]:visible').click();
await page.waitForTimeout(120);
checks.proModeShowsEngineeringSidebar = await page.locator('.right-sidebar').isVisible().catch(() => false);
checks.proModeShowsEvidenceTrigger = await page.locator('#evidenceTrigger').isVisible().catch(() => false);
checks.proModeShowsAgentCenter = await page.locator('#agentCenterTrigger').isVisible().catch(() => false);
await page.screenshot({ path: 'tests/mode-pro-workspace.png', fullPage: false });
await page.locator('.yj-mode-btn[data-mode="normal"]:visible').click();
await page.waitForTimeout(80);
await page.locator('#yj-workspace-back-btn').click();
await page.waitForTimeout(100);
checks.workspaceBackReturnsHome = await page.locator('#yj-page-home.yj-page-active').isVisible().catch(() => false);
await page.evaluate(() => window.YJOpenWorkspace());
await page.waitForTimeout(100);
checks.workspaceBackPreservesOutputs = await page.locator('[data-demo-core]').count().then(count => count === 4);
await page.setViewportSize({ width: 1440, height: 720 });
checks.workspaceHasPageScroll = await page.evaluate(() => {
  const app = document.querySelector('.app-container');
  if (!app) return false;
  return document.documentElement.scrollHeight > window.innerHeight &&
    app.getBoundingClientRect().height > window.innerHeight &&
    getComputedStyle(app).overflowY !== 'hidden';
});
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(100);
checks.workspaceFooterReachable = await page.locator('.footer-bar').evaluate(node => {
  const box = node.getBoundingClientRect();
  return box.top < window.innerHeight && box.bottom > 0;
}).catch(() => false);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(100);
await page.screenshot({ path: 'tests/static-pages-fixed.png', fullPage: false });

const result = {
  base,
  checks,
  messageMetrics,
  errors,
  localHttpErrors,
  passed: Object.values(checks).every(Boolean) && errors.length === 0 && localHttpErrors.length === 0,
};
fs.writeFileSync('tests/static-pages-acceptance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);
