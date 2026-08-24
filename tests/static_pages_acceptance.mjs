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

await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const checks = {
  title: (await page.title()).includes('云匠'),
  projectCenter: await page.locator('#yj-project-root').isVisible().catch(() => false),
  home: await page.locator('#yj-page-home.yj-page-active').isVisible().catch(() => false),
  quickDemoButton: await page.locator('#yj-home-demo').isVisible().catch(() => false),
  apiBaseNotGitHubPages: await page.evaluate(() => !String(window.YJBackendBridge?.base || '').includes('github.io')),
};
await page.locator('#yj-home-demo').click();
await page.waitForTimeout(200);
checks.quickDemoPage = await page.locator('#yj-page-quickdemo.yj-page-active').isVisible().catch(() => false);
await page.locator('#yj-demo-run').click();
await page.waitForTimeout(200);
checks.zeroTokenDemo = await page.locator('#yj-demo-output').innerText().then(text => text.includes('零 Token')).catch(() => false);
checks.runEvidence = await page.locator('#runEvidencePanel.open').count().then(count => count === 1);
checks.allExperts = await page.locator('#evidenceExperts').innerText().then(text => text.trim() === '17').catch(() => false);
await page.screenshot({ path: 'tests/static-pages-fixed.png', fullPage: false });

const result = {
  base,
  checks,
  errors,
  localHttpErrors,
  passed: Object.values(checks).every(Boolean) && errors.length === 0 && localHttpErrors.length === 0,
};
fs.writeFileSync('tests/static-pages-acceptance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);

