/**
 * Auditoria de responsividade do FebraHub.
 *
 * Mede em vez de olhar: percorre cada hub em vários tamanhos de tela e reporta
 * o que estoura a largura, o que fica pequeno demais para o dedo e o texto que
 * encolhe abaixo do legível. Roda com o dev server no ar.
 *
 *   node audita_mobile.js [base]
 */
const { chromium } = require(process.env.PW || 'playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:3310';
const EMAIL = process.env.EMAIL_QA || 'dulcemariano@febracis.com.br';
const SENHA = process.env.SENHA_QA || 'g-7TAPbAW7MX_5LA';

const TELAS = [
  { nome: 'iPhone SE',  w: 375, h: 667 },
  { nome: 'iPhone 14',  w: 390, h: 844 },
  { nome: 'Android',    w: 360, h: 800 },
  { nome: 'tablet',     w: 768, h: 1024 },
  { nome: 'desktop',    w: 1440, h: 900 },
];

const HUBS = ['executivo', 'comercial', 'financeiro', 'marketing', 'pedagogico', 'loja', 'eventos', 'integracoes'];

const medir = (limiteToque) => {
  const vw = window.innerWidth;
  const rolavel = (el) =>
    el.closest('.fh-rolagem-x, .fh-grafico, table') ||
    (() => { let p = el; while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; p = p.parentElement; } return false; })();

  const estouros = [];
  const toquePequeno = [];
  const textoMinusculo = [];

  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    // 1. Estouro horizontal fora de container rolável.
    if (r.right > vw + 1 && !rolavel(el)) {
      estouros.push({ tag: el.tagName.toLowerCase(), larg: Math.round(r.width), dir: Math.round(r.right), txt: (el.textContent || '').trim().slice(0, 34) });
    }

    // 2. Alvo de toque: só o que é clicável de verdade.
    const clicavel = el.matches('button, a[href], input, select, [role="button"]');
    if (clicavel) {
      // O ::after de .fh-toque amplia o alvo sem mudar a caixa do elemento.
      const ampliado = el.classList.contains('fh-toque');
      const alvo = ampliado ? 40 : Math.min(r.width, r.height);
      // Só cobra alvo de dedo onde há dedo. No desktop o ponteiro é preciso e
      // 27px é o desenho original — cobrar 40 ali seria inventar problema.
      if (limiteToque > 0 && alvo < limiteToque) {
        toquePequeno.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), txt: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26) });
      }
    }

    // 3. Texto pequeno demais. Ignora SVG: lá o tamanho é do viewBox e escala
    //    com a caixa, então comparar em px do documento não diz nada.
    if (limiteToque > 0 && el.children.length === 0 && (el.textContent || '').trim() && !el.closest('svg')) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs && fs < 9.5) textoMinusculo.push({ px: fs, txt: (el.textContent || '').trim().slice(0, 26) });
    }
  });

  return {
    doc: document.documentElement.scrollWidth,
    vw,
    estouros: estouros.slice(0, 6),
    n_estouros: estouros.length,
    toque: toquePequeno.slice(0, 5),
    n_toque: toquePequeno.length,
    texto: textoMinusculo.slice(0, 4),
    n_texto: textoMinusculo.length,
  };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();

  await pg.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const login = await pg.evaluate(async ([email, senha]) => {
    const r = await fetch('/api/auth/entrar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ email, senha }),
    });
    return r.status;
  }, [EMAIL, SENHA]);
  if (login !== 200) { console.error(`login falhou: HTTP ${login}`); process.exit(1); }

  let problemas = 0;
  for (const t of TELAS) {
    await pg.setViewportSize({ width: t.w, height: t.h });
    console.log(`\n═══ ${t.nome} (${t.w}×${t.h}) ═══`);
    for (const h of HUBS) {
      await pg.goto(`${BASE}/${h}`, { waitUntil: 'networkidle' }).catch(() => {});
      await pg.waitForTimeout(700);
      // O piso de toque só vale onde o CSS mobile está ativo (< 900px).
      const m = await pg.evaluate(medir, t.w < 900 ? 32 : 0);
      const falha = m.n_estouros > 0 || m.n_toque > 0 || m.n_texto > 0 || m.doc > t.w;
      if (falha) problemas++;
      const marca = falha ? 'FALHA' : ' ok  ';
      console.log(`  ${marca} ${h.padEnd(13)} doc=${String(m.doc).padStart(4)}  estouro=${m.n_estouros}  toque=${m.n_toque}  texto=${m.n_texto}`);
      if (m.n_estouros) m.estouros.forEach((e) => console.log(`         ↳ estoura ${e.tag} larg=${e.larg} dir=${e.dir} "${e.txt}"`));
      if (m.n_toque) m.toque.forEach((e) => console.log(`         ↳ toque ${e.tag} ${e.w}×${e.h} "${e.txt}"`));
      if (m.n_texto) m.texto.forEach((e) => console.log(`         ↳ texto ${e.px}px "${e.txt}"`));
    }
  }

  await browser.close();
  console.log(`\n${problemas === 0 ? 'TUDO OK' : problemas + ' combinações com problema'}`);
  process.exit(problemas === 0 ? 0 : 1);
})();
