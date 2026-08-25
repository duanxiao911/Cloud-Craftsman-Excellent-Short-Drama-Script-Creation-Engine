import { chromium } from 'file:///C:/Users/13306/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.YJ_STATIC_URL || 'http://127.0.0.1:8892';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.addInitScript(() => { window.YJ_ENGINE_API_BASE = 'https://reasonable-magic-production-7faf.up.railway.app'; });
const errors = [];
const localHttpErrors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.url().startsWith(base) && response.status() >= 400) localHttpErrors.push({ url: response.url(), status: response.status() });
});

await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof window.enterStudio === 'function' && !!window.YJAdaptationWorkbench, null, { timeout: 120000 });
await page.locator('#creatorName').fill('改编工作台验收');
await page.evaluate(() => window.enterStudio());
await page.waitForTimeout(120);
await page.locator('.yj-mode-btn[data-mode="pro"]:visible').click();
await page.locator('[data-view="adaptation"]').click();
await page.waitForTimeout(100);

const checks = {};
checks.navEntry = await page.locator('[data-view="adaptation"]').innerText().then(text => text.includes('IP改编'));
checks.workbenchVisible = await page.locator('#yj-page-adaptation.yj-page-active').isVisible();
checks.rightsGate = await page.locator('#yjaRights').isChecked();
checks.demoEntry = await page.locator('#yj-adapt-load-demo').isVisible();
await page.locator('#yj-adapt-load-demo').click();
checks.sevenStages = await page.locator('.yja-stage').count().then(count => count === 7);
checks.sourceStats = await page.locator('.yja-source-card').innerText().then(text => ['3','6','3'].every(value => text.includes(value)));
checks.traceableBeats = await page.locator('.yja-source-link').count().then(count => count >= 5);

await page.locator('#yj-adapt-run').click();
await page.waitForFunction(() => window.YJAdaptationWorkbench.getState().checkpoint === 'skeleton', null, { timeout: 10000 });
checks.skeletonCheckpointStops = await page.locator('#yj-adapt-skeleton-checkpoint').isVisible();
checks.pipelineStoppedBeforeDiagnosis = await page.evaluate(() => window.YJAdaptationWorkbench.getState().completed.length === 2);
await page.locator('#yj-adapt-approve-skeleton').click();
await page.waitForFunction(() => window.YJAdaptationWorkbench.getState().checkpoint === 'proposal', null, { timeout: 10000 });
checks.skeletonHumanApproval = await page.evaluate(() => window.YJAdaptationWorkbench.getState().data.invariants.every(item => item.approved));
checks.proposalCheckpointStops = await page.locator('#yj-adapt-proposal-checkpoint').isVisible();
checks.threeProposalComparisons = await page.locator('.yja-proposal').count().then(count => count === 3);
await page.locator('#yj-adapt-approve-proposals').click();
await page.waitForFunction(() => {
  const state = window.YJAdaptationWorkbench.getState();
  return state.completed.length === 7 && !state.running && state.tab === 'scenes';
}, null, { timeout: 10000 });
checks.pipelineComplete = await page.evaluate(() => window.YJAdaptationWorkbench.getState().completed.length === 7);
checks.threeSceneDeliveries = await page.locator('.yja-scene').count().then(count => count === 3);
checks.evidenceLog = await page.locator('#yj-adapt-evidence-log').innerText().then(text => ['人工锁定故事骨架','人工批准改编方向','改编工作台交付完成'].every(label => text.includes(label)));
checks.sessionPersisted = await page.evaluate(() => JSON.parse(localStorage.getItem('yunjiang_adaptation_workbench_v1')).completed.length === 7);
checks.noTokenDemo = await page.locator('.yja-source-card').count().then(count => count === 1);
await page.screenshot({ path: 'tests/adaptation-workbench-final.png', fullPage: true });

const result = { base, checks, errors, localHttpErrors, passed: Object.values(checks).every(Boolean) && errors.length === 0 && localHttpErrors.length === 0 };
fs.writeFileSync('tests/adaptation-workbench-acceptance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);
