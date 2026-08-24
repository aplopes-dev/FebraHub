import { chromium } from '/home/daniel/citybox/node_modules/.pnpm/@playwright+test@1.60.0/node_modules/@playwright/test/index.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => {
  const text = msg.text();
  if (/Hydration|hydration|didn't match/i.test(text)) errors.push('CONSOLE: ' + text.slice(0, 4000));
});
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + String(err).slice(0, 4000)));
for (const route of ['/agents/daniel-lobo', '/agents/daniel-lobo/listings']) {
  errors.length = 0;
  let status = 'n/a';
  try {
    const resp = await page.goto('http://localhost:3111' + route, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : 'n/a';
  } catch (e) {
    status = 'ERR ' + e.message.slice(0, 120);
  }
  console.log(`--- ${route} -> ${status}`);
  if (errors.length) console.log(errors.join('\n'));
  else console.log('   (sem erros de hydration no console)');
}
await browser.close();
