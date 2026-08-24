import { chromium } from '/home/daniel/citybox/node_modules/.pnpm/@playwright+test@1.60.0/node_modules/@playwright/test/index.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const fails = [];
page.on('response', async (resp) => {
  if (resp.status() >= 400) {
    let body = '';
    try { body = (await resp.text()).slice(0, 200); } catch {}
    fails.push(`${resp.status()} ${resp.request().method()} ${resp.url().replace('http://localhost:3111', '')} :: ${body}`);
  }
});
await page.goto('http://localhost:3111/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.getByRole('button', { name: /Entrar/i }).first().click();
await page.waitForTimeout(3000);
await page.fill('#username', 'lojista@citybox.com');
await page.fill('#password', 'citybox');
await page.click('#kc-login');
await page.waitForTimeout(6000);
await page.goto('http://localhost:3111/leads', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
console.log(fails.join('\n'));
await browser.close();
