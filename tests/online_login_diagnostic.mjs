import { chromium } from 'file:///C:/Users/13306/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const url = process.env.YJ_ONLINE_URL;
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(3000);
console.log(JSON.stringify({
  status: response?.status(),
  url: page.url(),
  title: await page.title(),
  htmlLength: (await page.content()).length,
  readyState: await page.evaluate(() => document.readyState),
  enterStudioType: await page.evaluate(() => typeof window.enterStudio),
  loginCount: await page.locator('#onboardingScreen').count(),
  loginVisible: await page.locator('#onboardingScreen').isVisible().catch(() => false),
  projectScript: await page.locator('script[src*="yunjiang-project-center.js"]').getAttribute('src').catch(() => null),
  errors,
}, null, 2));
await browser.close();
