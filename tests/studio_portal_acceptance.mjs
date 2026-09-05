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
await page.waitForFunction(() => typeof window.enterStudio === 'function' && !!window.YJAdaptationWorkbench, null, { timeout: 120000 });
await page.locator('#creatorName').fill('双工作台门户验收');
await page.evaluate(() => window.enterStudio());
await page.waitForTimeout(150);

const checks = {};
checks.portalVisible = await page.locator('#yj-page-home.yj-page-active').isVisible();
checks.threeWorkbenchCards = await page.locator('.yj-workbench-card').count().then(count => count === 3);
checks.originalValue = await page.locator('[data-workbench="original"]').innerText().then(text => ['故事大纲','人物','正文'].every(value => text.includes(value)));
checks.adaptationValue = await page.locator('[data-workbench="adaptation"]').innerText().then(text => ['文学作品拆解','漫画作品拆解'].every(value => text.includes(value)));
checks.navArchitecture = await page.locator('.yj-project-navbar-nav').innerText().then(text => ['原创工作台','IP改编工作台','文化出海工作台','我的项目','专家智库','成果中心','四类 Demo'].every(value => text.includes(value)));
checks.threeUtilityEntries = await page.locator('.yj-portal-utility button').count().then(count => count === 3);

await page.locator('[data-portal-adaptation="literary"]').click();
checks.literaryRoute = await page.evaluate(() => window.YJAdaptationWorkbench.getState().mode === 'literary');
checks.adaptationPageVisible = await page.locator('#yj-page-adaptation.yj-page-active').isVisible();
await page.locator('[data-view="home"]').click();
await page.locator('[data-portal-adaptation="manga"]').click();
checks.mangaRoute = await page.evaluate(() => window.YJAdaptationWorkbench.getState().mode === 'manga');
await page.locator('[data-view="home"]').click();

await page.locator('#yj-home-start').click();
checks.fourProjectTypes = await page.locator('input[name="yj-project-type"]').count().then(count => count === 4);
await page.locator('input[name="yj-project-type"][value="literary_adaptation"]').check();
checks.literaryModalContext = await page.locator('#yj-new-project-title').innerText().then(text => text.includes('文学改编'));
checks.adaptationInputLabel = await page.locator('#yj-project-input-label').innerText().then(text => text.includes('作品说明'));
checks.adaptationCreateCTA = await page.locator('#yj-modal-create').innerText().then(text => text.includes('改编工作台'));
await page.locator('#yj-modal-cancel').click();

await page.locator('#yj-home-demo').click();
checks.demoHubVisible = await page.locator('#yj-page-quickdemo.yj-page-active').isVisible();
checks.fourDemoCards = await page.locator('.yj-demo-card').count().then(count => count === 4);
checks.fourDemoTypes = await page.locator('.yj-demo-grid').innerText().then(text => ['文旅宣传 Demo','文学改编 Demo','漫画拆解 Demo','文化出海 Demo'].every(value => text.includes(value)));
await page.locator('[data-view="home"]').click();
await page.evaluate(() => { document.documentElement.setAttribute('data-theme','light'); document.body.setAttribute('data-theme','light'); });
await page.screenshot({ path: 'tests/studio-portal-final.png', fullPage: true });

const result = { base, checks, errors, localHttpErrors, passed: Object.values(checks).every(Boolean) && errors.length === 0 && localHttpErrors.length === 0 };
fs.writeFileSync('tests/studio-portal-acceptance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);
