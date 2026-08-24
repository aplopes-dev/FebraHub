#!/usr/bin/env node
/**
 * Sincroniza os realms Keycloak via Admin API — um realm por sistema (ADR C-16).
 *
 * O script é **genérico**: tudo que ele aplica vem dos JSONs em `../import/`.
 * Não há caso especial por `clientId` — a versão anterior tinha blocos `if
 * (client.clientId === 'citybox-backoffice')` porque um único client servia
 * quatro apps. Com um realm por sistema isso deixou de existir.
 *
 * Env:
 *   KEYCLOAK_URL              — default: http://127.0.0.1:8080
 *   KEYCLOAK_ADMIN            — default: admin
 *   KEYCLOAK_ADMIN_PASSWORD   — obrigatório fora de localhost
 *   KEYCLOAK_REALMS           — lista separada por vírgula; default: todos os
 *                               `*-realm.json` do diretório de import
 *   KEYCLOAK_SEED_USER_PASSWORD — senha dos usuários de seed (dev)
 *
 * Secrets de client: cada client confidencial declara `secretEnv` no seu JSON
 * (ex.: `KEYCLOAK_ERP_WEB_SECRET`). Em Keycloak local, sem a env definida, cai
 * no default de dev `<clientId>-dev-secret`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KC = process.env.KEYCLOAK_URL ?? 'http://127.0.0.1:8080';
const ADMIN_USER = process.env.KEYCLOAK_ADMIN ?? 'admin';
const isLocalKc = /localhost|127\.0\.0\.1/.test(KC);
const ADMIN_PASS = process.env.KEYCLOAK_ADMIN_PASSWORD ?? (isLocalKc ? 'citybox' : '');

if (!ADMIN_PASS) {
  console.error('KEYCLOAK_ADMIN_PASSWORD é obrigatório (exceto Keycloak local em dev).');
  process.exit(1);
}

const IMPORT_DIR = fileURLToPath(new URL('../import/', import.meta.url));

/** Realms a sincronizar: env explícita, ou todos os arquivos do diretório. */
function resolveRealms() {
  const fromEnv = process.env.KEYCLOAK_REALMS?.trim();
  if (fromEnv) return fromEnv.split(',').map((r) => r.trim()).filter(Boolean);
  return readdirSync(IMPORT_DIR)
    .filter((f) => f.endsWith('-realm.json'))
    .map((f) => f.replace(/-realm\.json$/, ''))
    .sort();
}

function loadSpec(realm) {
  return JSON.parse(readFileSync(`${IMPORT_DIR}${realm}-realm.json`, 'utf8'));
}

async function token() {
  const body = new URLSearchParams({
    client_id: 'admin-cli',
    username: ADMIN_USER,
    password: ADMIN_PASS,
    grant_type: 'password',
  });
  const res = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, { method: 'POST', body });
  if (!res.ok) throw new Error(`Admin token ${res.status}`);
  return (await res.json()).access_token;
}

async function api(method, path, t, body) {
  const res = await fetch(`${KC}${path}`, {
    method,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

/**
 * Secret do client. Só o `secretEnv` declarado no JSON — sem tabela de nomes
 * no script, que é o que fazia a versão anterior divergir dos `.env` dos apps.
 */
function resolveClientSecret(client) {
  if (client.publicClient) return undefined;
  const fromEnv = client.secretEnv ? process.env[client.secretEnv]?.trim() : '';
  if (fromEnv) return fromEnv;
  if (isLocalKc) return `${client.clientId}-dev-secret`;
  throw new Error(
    `Client ${client.clientId}: defina ${client.secretEnv ?? '<secretEnv ausente no JSON>'}`,
  );
}

function buildSmtpServer() {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!host || !from) return null;

  const port = String(process.env.SMTP_PORT?.trim() || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === '465';
  const user = process.env.SMTP_USER?.trim() || from;
  const password = process.env.SMTP_PASS ?? '';

  return {
    host,
    port,
    from,
    fromDisplayName: process.env.SMTP_FROM_NAME?.trim() || 'Citybox',
    replyTo: process.env.SMTP_REPLY_TO?.trim() || from,
    replyToDisplayName: process.env.SMTP_FROM_NAME?.trim() || 'Citybox',
    envelopeFrom: process.env.SMTP_ENVELOPE_FROM?.trim() || from,
    auth: password ? 'true' : 'false',
    user,
    password,
    ssl: secure ? 'true' : 'false',
    starttls: secure ? 'false' : 'true',
  };
}

async function realmExists(realm, t) {
  try {
    await api('GET', `/admin/realms/${realm}`, t);
    return true;
  } catch {
    return false;
  }
}

async function ensureRealm(realm, spec, t) {
  if (await realmExists(realm, t)) return;
  const { users: _u, roles: _r, clients: _c, requiredActions: _ra, ...payload } = spec;
  console.log(`  · criando realm`);
  await api('POST', '/admin/realms', t, { ...payload, realm });
}

async function applyRealmSettings(realm, spec, t, smtpServer) {
  const patch = {
    displayName: spec.displayName,
    loginTheme: spec.loginTheme ?? 'citybox',
    accountTheme: spec.accountTheme ?? 'citybox',
    emailTheme: spec.emailTheme ?? 'citybox',
    internationalizationEnabled: spec.internationalizationEnabled ?? true,
    supportedLocales: spec.supportedLocales ?? ['pt'],
    defaultLocale: spec.defaultLocale ?? 'pt',
    ssoSessionIdleTimeout: spec.ssoSessionIdleTimeout,
    ssoSessionMaxLifespan: spec.ssoSessionMaxLifespan,
    accessTokenLifespan: spec.accessTokenLifespan ?? 1800,
    loginWithEmailAllowed: spec.loginWithEmailAllowed,
    duplicateEmailsAllowed: spec.duplicateEmailsAllowed ?? false,
    registrationAllowed: spec.registrationAllowed ?? false,
    resetPasswordAllowed: spec.resetPasswordAllowed,
    verifyEmail: spec.verifyEmail ?? false,
  };
  // Política de senha só é aplicada fora de localhost.
  //
  // O realm `citybox-admin` exige 14 caracteres com maiúscula, dígito e
  // especial, e MFA obrigatório — proporcional a ser o realm de maior
  // privilégio (ADR C-16 §Políticas por realm). Isso é o que vale em produção.
  //
  // Em Keycloak local isso só atrapalha: criar um usuário de teste vira um
  // exercício de gerador de senha, e o TOTP obrigatório pede um app
  // autenticador para abrir uma tela de dev. O JSON **continua** com a política
  // forte — quem decide é o destino, não o arquivo.
  if (spec.passwordPolicy && !isLocalKc) {
    patch.passwordPolicy = spec.passwordPolicy;
  }
  for (const key of ['otpPolicyType', 'otpPolicyAlgorithm', 'otpPolicyDigits', 'otpPolicyPeriod']) {
    if (spec[key] !== undefined) patch[key] = spec[key];
  }
  if (smtpServer) patch.smtpServer = smtpServer;
  await api('PUT', `/admin/realms/${realm}`, t, patch);
  console.log(`  · settings${spec.passwordPolicy ? ' + passwordPolicy' : ''}${smtpServer ? ' + SMTP' : ''}`);
}

async function applyRealmRoles(realm, spec, t) {
  for (const role of spec.roles?.realm ?? []) {
    try {
      await api('POST', `/admin/realms/${realm}/roles`, t, {
        name: role.name,
        description: role.description,
      });
      console.log(`  · role ${role.name}`);
    } catch {
      console.log(`  · role ${role.name} (já existe)`);
    }
  }
}

/** `CLIENT.DESCRIPTION` é `varchar(255)`; estourar devolve 500 sem explicação. */
const CLIENT_DESCRIPTION_MAX = 255;

async function applyClients(realm, spec, t) {
  const existingClients = await api('GET', `/admin/realms/${realm}/clients`, t);
  const byClientId = Object.fromEntries(existingClients.map((c) => [c.clientId, c]));

  for (const client of spec.clients ?? []) {
    if ((client.description?.length ?? 0) > CLIENT_DESCRIPTION_MAX) {
      throw new Error(
        `Client ${client.clientId}: description tem ${client.description.length} chars ` +
          `(máximo ${CLIENT_DESCRIPTION_MAX}). O Keycloak devolveria 500 sem dizer o motivo.`,
      );
    }
    const payload = {
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      enabled: client.enabled ?? true,
      publicClient: client.publicClient ?? false,
      standardFlowEnabled: client.standardFlowEnabled ?? false,
      directAccessGrantsEnabled: client.directAccessGrantsEnabled ?? false,
      serviceAccountsEnabled: client.serviceAccountsEnabled ?? false,
      // Invariante do ADR C-16: redirect URIs são listadas uma a uma nos JSONs.
      // Nada de `http://localhost:*` — qualquer processo local capturaria o code.
      redirectUris: client.redirectUris ?? [],
      webOrigins: (client.webOrigins ?? []).filter((o) => o !== '*'),
      attributes: client.attributes ?? {},
    };
    const secret = resolveClientSecret(client);
    if (secret) payload.secret = secret;

    const existing = byClientId[client.clientId];
    if (existing) {
      await api('PUT', `/admin/realms/${realm}/clients/${existing.id}`, t, { ...existing, ...payload });
      console.log(`  · client ${client.clientId} atualizado`);
    } else {
      await api('POST', `/admin/realms/${realm}/clients`, t, payload);
      console.log(`  · client ${client.clientId} criado`);
    }
  }

  const refreshed = await api('GET', `/admin/realms/${realm}/clients`, t);
  return Object.fromEntries(refreshed.map((c) => [c.clientId, c.id]));
}

async function applyClientRoles(realm, spec, t, uuidByClientId) {
  for (const [clientId, roles] of Object.entries(spec.roles?.client ?? {})) {
    const uuid = uuidByClientId[clientId];
    if (!uuid) {
      console.log(`  · client roles de ${clientId} (client ausente, skip)`);
      continue;
    }
    for (const role of roles) {
      try {
        await api('POST', `/admin/realms/${realm}/clients/${uuid}/roles`, t, {
          name: role.name,
          description: role.description,
        });
        console.log(`  · client role ${clientId}/${role.name}`);
      } catch {
        console.log(`  · client role ${clientId}/${role.name} (já existe)`);
      }
    }
  }
}

/**
 * Role mappings do service account, dirigidos pelo JSON.
 *
 * É aqui que o menor privilégio do ADR C-16 acontece de fato:
 * `<sistema>-provisioning` recebe `manage-users` de `realm-management` DESTE
 * realm, e `admin-m2m` recebe só `platform.admin` — sem `manage-users`.
 */
async function applyServiceAccountRoles(realm, spec, t, uuidByClientId) {
  for (const client of spec.clients ?? []) {
    if (!client.serviceAccountsEnabled) continue;
    const uuid = uuidByClientId[client.clientId];
    if (!uuid) continue;

    const sa = await api('GET', `/admin/realms/${realm}/clients/${uuid}/service-account-user`, t);
    if (!sa?.id) continue;

    for (const roleName of client.serviceAccountRealmRoles ?? []) {
      try {
        const role = await api('GET', `/admin/realms/${realm}/roles/${roleName}`, t);
        await api('POST', `/admin/realms/${realm}/users/${sa.id}/role-mappings/realm`, t, [role]);
        console.log(`  · ${client.clientId} +realm ${roleName}`);
      } catch (err) {
        console.log(`  · ${client.clientId} realm ${roleName} (skip: ${err.message})`);
      }
    }

    for (const [targetClient, roles] of Object.entries(client.serviceAccountClientRoles ?? {})) {
      const targetUuid = uuidByClientId[targetClient];
      if (!targetUuid) {
        console.log(`  · ${client.clientId} → ${targetClient} (client ausente, skip)`);
        continue;
      }
      for (const roleName of roles) {
        try {
          const role = await api('GET', `/admin/realms/${realm}/clients/${targetUuid}/roles/${roleName}`, t);
          await api(
            'POST',
            `/admin/realms/${realm}/users/${sa.id}/role-mappings/clients/${targetUuid}`,
            t,
            [role],
          );
          console.log(`  · ${client.clientId} +${targetClient} ${roleName}`);
        } catch (err) {
          console.log(`  · ${client.clientId} ${targetClient}/${roleName} (skip: ${err.message})`);
        }
      }
    }
  }
}

async function ensureSeedUser(realm, user, t) {
  const found = await api(
    'GET',
    `/admin/realms/${realm}/users?username=${encodeURIComponent(user.username)}&exact=true`,
    t,
  );
  if (found?.[0]?.id) return found[0].id;

  const password = process.env.KEYCLOAK_SEED_USER_PASSWORD?.trim()
    ?? user.credentials?.find((c) => c.type === 'password')?.value
    ?? 'citybox';

  await api('POST', `/admin/realms/${realm}/users`, t, {
    username: user.username,
    enabled: user.enabled ?? true,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    emailVerified: true,
    credentials: [{ type: 'password', value: password, temporary: false }],
  });

  const created = await api(
    'GET',
    `/admin/realms/${realm}/users?username=${encodeURIComponent(user.username)}&exact=true`,
    t,
  );
  const id = created?.[0]?.id;
  if (!id) throw new Error(`usuário ${user.username} criado mas o id não foi resolvido`);
  console.log(`  · usuário ${user.username} criado`);
  return id;
}

async function applySeedUsers(realm, spec, t, uuidByClientId) {
  for (const user of spec.users ?? []) {
    let id;
    try {
      id = await ensureSeedUser(realm, user, t);
    } catch (err) {
      console.log(`  · usuário ${user.username} (erro: ${err.message})`);
      continue;
    }

    for (const roleName of user.realmRoles ?? []) {
      try {
        const role = await api('GET', `/admin/realms/${realm}/roles/${roleName}`, t);
        await api('POST', `/admin/realms/${realm}/users/${id}/role-mappings/realm`, t, [role]);
        console.log(`  · ${user.username} +realm ${roleName}`);
      } catch {
        console.log(`  · ${user.username} realm ${roleName} (skip)`);
      }
    }

    for (const [clientId, roles] of Object.entries(user.clientRoles ?? {})) {
      const uuid = uuidByClientId[clientId];
      if (!uuid) continue;
      for (const roleName of roles) {
        try {
          const role = await api('GET', `/admin/realms/${realm}/clients/${uuid}/roles/${roleName}`, t);
          await api('POST', `/admin/realms/${realm}/users/${id}/role-mappings/clients/${uuid}`, t, [role]);
          console.log(`  · ${user.username} +${clientId} ${roleName}`);
        } catch {
          console.log(`  · ${user.username} ${clientId}/${roleName} (skip)`);
        }
      }
    }
  }
}

/** Primeiro acesso com senha provisória + MFA onde o realm exigir. */
async function applyRequiredActions(realm, spec, t) {
  const base = [
    { alias: 'UPDATE_PASSWORD', enabled: true, defaultAction: false, priority: 10 },
    { alias: 'VERIFY_EMAIL', enabled: true, defaultAction: false, priority: 20 },
    { alias: 'UPDATE_PROFILE', enabled: false, defaultAction: false, priority: 30 },
    { alias: 'VERIFY_PROFILE', enabled: false, defaultAction: false, priority: 40 },
  ];
  // Mesma regra da política de senha: em Keycloak local, uma required action
  // marcada como obrigatória (ex.: `CONFIGURE_TOTP` do realm do admin) entra
  // desligada — senão todo login de dev começa pedindo app autenticador.
  const overrides = Object.fromEntries(
    (spec.requiredActions ?? []).map((a) => [
      a.alias,
      isLocalKc ? { ...a, defaultAction: false } : a,
    ]),
  );
  const actions = [...base.filter((a) => !overrides[a.alias]), ...Object.values(overrides)];

  for (const action of actions) {
    try {
      const current = await api(
        'GET',
        `/admin/realms/${realm}/authentication/required-actions/${action.alias}`,
        t,
      );
      await api(
        'PUT',
        `/admin/realms/${realm}/authentication/required-actions/${action.alias}`,
        t,
        { ...current, ...action },
      );
      const flag = action.defaultAction ? ' (obrigatória)' : '';
      console.log(`  · ${action.alias} enabled=${action.enabled}${flag}`);
    } catch (err) {
      console.log(`  · ${action.alias} (skip: ${err.message})`);
    }
  }
}

/** firstName/lastName opcionais: o convite cria a identidade sem perfil completo. */
async function relaxUserProfile(realm, t) {
  try {
    const profile = await api('GET', `/admin/realms/${realm}/users/profile`, t);
    let changed = false;
    for (const attr of profile?.attributes ?? []) {
      if ((attr.name === 'firstName' || attr.name === 'lastName') && attr.required) {
        delete attr.required;
        changed = true;
      }
    }
    if (changed) {
      await api('PUT', `/admin/realms/${realm}/users/profile`, t, profile);
      console.log('  · firstName/lastName opcionais');
    }
  } catch (err) {
    console.log(`  · user profile (skip: ${err.message})`);
  }
}

async function syncRealm(realm, t, smtpServer) {
  console.log(`\n▶ ${realm}`);
  const spec = loadSpec(realm);
  await ensureRealm(realm, spec, t);
  await applyRealmSettings(realm, spec, t, smtpServer);
  await applyRealmRoles(realm, spec, t);
  const uuidByClientId = await applyClients(realm, spec, t);
  await applyClientRoles(realm, spec, t, uuidByClientId);
  await applyServiceAccountRoles(realm, spec, t, uuidByClientId);
  await applySeedUsers(realm, spec, t, uuidByClientId);
  await applyRequiredActions(realm, spec, t);
  await relaxUserProfile(realm, t);
}

async function applyMasterTheme(t) {
  try {
    const master = await api('GET', '/admin/realms/master', t);
    await api('PUT', '/admin/realms/master', t, {
      ...master,
      adminTheme: 'citybox',
      internationalizationEnabled: true,
      supportedLocales: ['pt'],
      defaultLocale: 'pt',
    });
    console.log('\n▶ master — adminTheme=citybox');
  } catch (err) {
    console.log(`\n▶ master theme (skip: ${err.message})`);
  }
}

const realms = resolveRealms();
if (realms.length === 0) {
  console.error(`Nenhum *-realm.json encontrado em ${IMPORT_DIR}`);
  process.exit(1);
}

const t = await token();
const smtpServer = buildSmtpServer();
if (!smtpServer) {
  console.log('SMTP skip (defina SMTP_HOST e SMTP_FROM em infra/plataform-apps.env)');
}

for (const realm of realms) {
  await syncRealm(realm, t, smtpServer);
}
await applyMasterTheme(t);

console.log(`\n✓ Keycloak sync OK — ${realms.length} realm(s): ${realms.join(', ')}`);
