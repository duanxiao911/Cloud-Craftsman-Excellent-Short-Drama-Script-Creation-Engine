import { chromium } from 'file:///C:/Users/13306/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.YJ_STATIC_URL || 'http://127.0.0.1:8892';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1720, height: 1080 } });
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem('theme', 'light');
  window.YJ_ENGINE_API_BASE = 'https://reasonable-magic-production-7faf.up.railway.app';
});
const errors = [];
const localHttpErrors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.url().startsWith(base) && response.status() >= 400) localHttpErrors.push({ url: response.url(), status: response.status() });
});

await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof window.enterStudio === 'function', null, { timeout: 120000 });
await page.waitForFunction(() => !!window.YJGlobalWorkbench, null, { timeout: 10000 });
await page.locator('#creatorName').fill('文化出海验收');
await page.evaluate(() => window.enterStudio());
await page.waitForTimeout(150);

const checks = {};
checks.threeWorkbenches = await page.locator('.yj-workbench-card').count().then(count => count === 3);
checks.globalPortalCard = await page.locator('[data-workbench="global"]').innerText().then(text => ['文化出海','文化资产','风险雷达','双语','发行包'].every(value => text.includes(value)));
checks.globalNav = await page.locator('[data-view="global"]').isVisible();
checks.fourProjectTypes = await page.locator('#yj-home-start').click().then(() => page.locator('input[name="yj-project-type"]').count()).then(count => count === 4);
await page.locator('#yj-modal-cancel').click();
await page.locator('[data-portal-global]').click();
checks.workbenchVisible = await page.locator('#yj-page-global.yj-page-active').isVisible();
checks.sevenStages = await page.locator('.yjg-stage').count().then(count => count === 7);
checks.marketConfiguration = await page.locator('.yjg-source').innerText().then(text => ['目标市场','目标语言','发行平台'].every(value => text.includes(value)));

await page.locator('[data-yjg="run"]').click();
await page.waitForFunction(() => window.YJGlobalWorkbench.getState().checkpoint === 'assets', null, { timeout: 10000 });
checks.assetCheckpoint = await page.locator('[data-yjg="approve-assets"]').isVisible();
checks.threeCulturalAssets = await page.locator('.yjg-main .yjg-card').count().then(count => count === 3);
await page.locator('[data-yjg="approve-assets"]').click();
await page.waitForFunction(() => window.YJGlobalWorkbench.getState().checkpoint === 'localization', null, { timeout: 10000 });
checks.localizationCheckpoint = await page.locator('[data-yjg="approve-localization"]').isVisible();
checks.threeComparisons = await page.locator('.yjg-compare').count().then(count => count === 3);
await page.locator('[data-yjg="approve-localization"]').click();
await page.waitForFunction(() => { const s = window.YJGlobalWorkbench.getState(); return s.completed.length === 7 && !s.running && s.tab === 'package'; }, null, { timeout: 12000 });
checks.pipelineComplete = await page.evaluate(() => window.YJGlobalWorkbench.getState().completed.length === 7);
checks.sixDeliverables = await page.locator('.yjg-pack .yjg-card').count().then(count => count === 6);
checks.agentEvidence = await page.locator('.yjg-log').count().then(count => count >= 14);
checks.sessionPersisted = await page.evaluate(() => !!localStorage.getItem('yunjiang_global_workbench_v1'));
checks.exportEnabled = await page.locator('[data-yjg="export"]:not([disabled])').isVisible();
await page.screenshot({ path: 'tests/global-workbench-final.png', fullPage: true });

const result = { base, checks, errors, localHttpErrors, passed: Object.values(checks).every(Boolean) && errors.length === 0 && localHttpErrors.length === 0 };
fs.writeFileSync('tests/global-workbench-acceptance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);
