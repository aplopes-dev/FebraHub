import { chromium } from '/home/daniel/citybox/node_modules/.pnpm/@playwright+test@1.60.0/node_modules/@playwright/test/index.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrs = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrs.push('CONSOLE: ' + msg.text().slice(0, 2500)); });
page.on('pageerror', (err) => consoleErrs.push('PAGEERROR: ' + String(err).slice(0, 2500)));

await page.goto('http://localhost:3111/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.getByRole('button', { name: /Entrar/i }).first().click();
await page.waitForTimeout(3000);
await page.fill('#username', 'lojista@citybox.com');
await page.fill('#password', 'citybox');
await page.click('#kc-login');
await page.waitForTimeout(6000);
console.log(`[login] url: ${page.url().slice(0, 130)}`);

// pega ids reais para as rotas de detalhe
await page.goto('http://localhost:3111/leads', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
let leadId = '';
const firstLead = await page.locator('a[href^="/leads/"]').first().getAttribute('href').catch(() => null);
if (firstLead) leadId = firstLead.replace('/leads/', '').split('?')[0];
await page.goto('http://localhost:3111/properties', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
let propId = '';
const firstProp = await page.locator('a[href^="/properties/"]').first().getAttribute('href').catch(() => null);
if (firstProp) propId = firstProp.replace('/properties/', '').split('?')[0];
console.log(`[ids] lead=${leadId} property=${propId}`);

const routes = ['/', '/leads', '/properties', '/transactions', '/calendar', '/settings',
                '/transactions/finance', '/transactions/reports', '/leads/new', '/properties/new'];
if (leadId) routes.push(`/leads/${leadId}`);
if (propId) routes.push(`/properties/${propId}`);
for (const route of routes) {
  consoleErrs.length = 0;
  let s = 'n/a';
  try {
    const resp = await page.goto('http://localhost:3111' + route, { waitUntil: 'networkidle', timeout: 30000 });
    s = resp ? resp.status() : 'n/a';
    await page.waitForTimeout(2500);
  } catch (e) { s = 'ERR ' + e.message.slice(0, 120); }
  const hydration = consoleErrs.filter((l) => /[Hh]ydration|didn't match/i.test(l));
  console.log(`\n=== ${route} -> ${s}`);
  if (hydration.length) console.log(hydration.join('\n---\n'));
  else console.log('   (sem erros de hydration)');
  const others = consoleErrs.filter((l) => !/[Hh]ydration/.test(l));
  if (others.length) console.log('   [outros: ' + others.length + '] ' + others[0].slice(0, 250));
}

await ctx.storageState({ path: '/tmp/opencode/imoveis-auth.json' });
await browser.close();
console.log('\n[session salva em /tmp/opencode/imoveis-auth.json]');
