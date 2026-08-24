import { chromium } from '/home/daniel/citybox/node_modules/.pnpm/@playwright+test@1.60.0/node_modules/@playwright/test/index.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
for (const [user, pass] of [['lojista', 'citybox'], ['admin', 'citybox'], ['lojista@citybox.com', 'citybox'], ['admin@citybox.com', 'citybox']]) {
  const page = await browser.newPage();
  await page.goto('http://localhost:3111/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: /Entrar/i }).first().click();
  await page.waitForTimeout(3000);
  await page.fill('#username', user);
  await page.fill('#password', pass);
  await page.click('#kc-login');
  await page.waitForTimeout(5000);
  const u = page.url();
  if (u.includes('/realms/')) {
    const invalid = await page.evaluate(() => document.body.innerText.includes('inválida') || document.body.innerText.includes('invalid'));
    console.log(`${user} / ${pass} -> SEM LOGIN (invalid=${invalid}) ${u.includes('login-actions') ? 'login-actions' : u.slice(0, 80)}`);
  } else {
    console.log(`${user} / ${pass} -> OK url=${u.slice(0, 90)}`);
  }
  await page.close();
}
await browser.close();
