import { chromium } from 'file:///C:/Users/13306/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.YJ_STATIC_URL || 'http://127.0.0.1:8892';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1720, height: 1100 } });
await page.addInitScript(() => {
  localStorage.clear();
  window.YJ_ENGINE_API_BASE = 'https://reasonable-magic-production-7faf.up.railway.app';
});
const errors = [];
const localHttpErrors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.url().startsWith(base) && response.status() >= 400) localHttpErrors.push({ url: response.url(), status: response.status() });
});

await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof window.enterStudio === 'function' && !!window.YJAdaptationWorkbench, null, { timeout: 120000 });
await page.locator('#creatorName').fill('漫画工作台验收');
await page.evaluate(() => window.enterStudio());
await page.waitForTimeout(120);
await page.locator('.yj-mode-btn[data-mode="pro"]:visible').click();
await page.locator('[data-view="adaptation"]').click();
await page.locator('[data-yja="mode-manga"]').click();

const checks = {};
checks.dualMode = await page.locator('.yja-mode-switch button').count().then(count => count === 2);
checks.mangaModeSelected = await page.locator('[data-yja="mode-manga"]').getAttribute('class').then(value => value.includes('active'));
checks.mangaFormats = await page.locator('.yja-drop').innerText().then(text => ['PDF','CBZ','JPG','PNG'].every(value => text.includes(value)));
checks.rightsGate = await page.locator('#yjaRights').isChecked();
await page.locator('#yj-adapt-load-demo').click();
checks.eightStages = await page.locator('.yja-stage').count().then(count => count === 8);
checks.pagePanelStats = await page.locator('.yja-source-card').innerText().then(text => ['3','页','8','画格'].every(value => text.includes(value)));
checks.threePages = await page.locator('.yja-manga-page').count().then(count => count === 3);
checks.eightPanels = await page.locator('.yja-panel-art').count().then(count => count === 8);
checks.threeSpeechBubbles = await page.locator('.yja-speech-row').count().then(count => count === 3);
await page.locator('[data-manga-speaker="b02"]').selectOption({ label: '父亲' });
checks.humanCorrection = await page.evaluate(() => {
  const line = window.YJAdaptationWorkbench.getState().data.speech.find(item => item.id === 'b02');
  return line.speaker === '父亲' && line.corrected === true && line.confidence === 100;
});

await page.locator('#yj-adapt-run').click();
await page.waitForFunction(() => window.YJAdaptationWorkbench.getState().checkpoint === 'skeleton', null, { timeout: 10000 });
checks.skeletonCheckpointStops = await page.locator('#yj-adapt-skeleton-checkpoint').isVisible();
checks.visualStagesCompleteFirst = await page.evaluate(() => window.YJAdaptationWorkbench.getState().completed.length === 3);
await page.locator('#yj-adapt-approve-skeleton').click();
await page.waitForFunction(() => window.YJAdaptationWorkbench.getState().checkpoint === 'proposal', null, { timeout: 10000 });
checks.proposalCheckpointStops = await page.locator('#yj-adapt-proposal-checkpoint').isVisible();
checks.threeShotMappings = await page.locator('.yja-shot-map').count().then(count => count === 3);
await page.locator('#yj-adapt-approve-proposals').click();
await page.waitForFunction(() => {
  const state = window.YJAdaptationWorkbench.getState();
  return state.completed.length === 8 && !state.running && state.tab === 'scenes';
}, null, { timeout: 10000 });
checks.pipelineComplete = await page.evaluate(() => window.YJAdaptationWorkbench.getState().completed.length === 8);
checks.threeSceneDeliveries = await page.locator('.yja-scene').count().then(count => count === 3);
checks.evidenceLog = await page.locator('#yj-adapt-evidence-log').innerText().then(text => ['人工校正对白归属','人工锁定故事骨架','人工批准改编方向','漫画拆解与改编交付完成'].every(label => text.includes(label)));
checks.sessionPersisted = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('yunjiang_adaptation_workbench_v1'));
  return saved.mode === 'manga' && saved.completed.length === 8 && saved.data.speech.some(line => line.corrected);
});
checks.zeroTokenDemo = await page.evaluate(() => !window.YJAdaptationWorkbench.getState().tokenUsage);
await page.locator('[data-yja-tab="panels"]').click();
await page.screenshot({ path: 'tests/manga-workbench-final.png', fullPage: true });

const result = { base, checks, errors, localHttpErrors, passed: Object.values(checks).every(Boolean) && errors.length === 0 && localHttpErrors.length === 0 };
fs.writeFileSync('tests/manga-workbench-acceptance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);
