import { chromium } from 'file:///C:/Users/13306/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base = process.env.YJ_BASE_URL || 'http://127.0.0.1:8877';
const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; const failedRequests=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('requestfailed', r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
await page.goto(base+'/demo/',{waitUntil:'networkidle'});
const checks={
  title:(await page.title()).includes('云匠'),
  projectCenter:await page.locator('#yj-project-root').isVisible().catch(()=>false),
  home:await page.locator('#yj-page-home.yj-page-active').isVisible().catch(()=>false),
  newProject:await page.locator('#yj-nav-new-btn').isVisible().catch(()=>false),
  quickDemo:await page.locator('#yj-home-demo').isVisible().catch(()=>false),
  onboardingHidden:!(await page.locator('#onboardingScreen').isVisible().catch(()=>false)),
};
await page.locator('#yj-home-demo').click();
await page.waitForTimeout(500);
checks.quickDemoPage=await page.locator('#yj-page-quickdemo.yj-page-active').isVisible().catch(()=>false);
await page.screenshot({path:'tests/audit-latest-browser.png'});
const result={base,checks,errors,failedRequests,passed:Object.values(checks).every(Boolean)&&errors.length===0&&failedRequests.length===0};
console.log(JSON.stringify(result,null,2));
await browser.close();
if(!result.passed)process.exit(1);
