#!/usr/bin/env node
/**
 * Configura Metabase (C-08): admin dev + fonte ilheus_dev via citybox_readonly.
 * Uso: node services/metabase/scripts/configure-ilheus.mjs
 */
const MB_URL = process.env.METABASE_URL ?? 'http://localhost:13002';
const ADMIN_EMAIL = process.env.MB_ADMIN_EMAIL ?? 'dev@citybox.com';
const ADMIN_PASSWORD = process.env.MB_ADMIN_PASSWORD ?? 'Citybox.MB.Dev2026!';
const DB_HOST = process.env.MB_SOURCE_HOST ?? 'citybox_postgres';
const DB_PORT = Number(process.env.MB_SOURCE_PORT ?? 5432);
const DB_NAME = process.env.MB_SOURCE_DB ?? 'ilheus_dev';
const DB_USER = process.env.MB_SOURCE_USER ?? 'citybox_readonly';
const DB_PASS = process.env.MB_SOURCE_PASSWORD ?? 'citybox_readonly';

async function json(method, path, body, cookie) {
  const res = await fetch(`${MB_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { data, cookie: setCookie.map((c) => c.split(';')[0]).join('; '), status: res.status };
}

async function ensureSetup() {
  const { data: props } = await json('GET', '/api/session/properties');
  const token = props?.['setup-token'];
  if (!token) {
    console.log('Metabase já configurado — pulando setup inicial');
    return false;
  }
  await json('POST', '/api/setup', {
    token,
    user: {
      first_name: 'Citybox',
      last_name: 'Dev',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
    prefs: { site_name: 'Citybox BI' },
  });
  console.log(`✓ Admin Metabase: ${ADMIN_EMAIL}`);
  return true;
}

async function login() {
  const { cookie } = await json('POST', '/api/session', {
    username: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return cookie;
}

async function ensureDatabase(cookie) {
  const { data: dbs } = await json('GET', '/api/database', null, cookie);
  const exists = Array.isArray(dbs?.data) && dbs.data.some((d) => d.name === 'Ilheus Dev');
  if (exists) {
    console.log('✓ Fonte "Ilheus Dev" já existe no Metabase');
    return;
  }
  await json('POST', '/api/database', {
    name: 'Ilheus Dev',
    engine: 'postgres',
    details: {
      host: DB_HOST,
      port: DB_PORT,
      dbname: DB_NAME,
      user: DB_USER,
      password: DB_PASS,
      ssl: false,
      'tunnel-enabled': false,
    },
    auto_run_queries: true,
    is_full_sync: true,
    schedules: {},
  }, cookie);
  console.log(`✓ Fonte "Ilheus Dev" → ${DB_HOST}:${DB_PORT}/${DB_NAME} (${DB_USER})`);
}

async function main() {
  await ensureSetup();
  const cookie = await login();
  await ensureDatabase(cookie);
  console.log(`\nMetabase: ${MB_URL}`);
  console.log(`Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
