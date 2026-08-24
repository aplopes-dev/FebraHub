import { KeycloakAdminService } from './keycloak-admin.service';

const ORIGINAL_ENV = { ...process.env };

describe('KeycloakAdminService (admin-api)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.KEYCLOAK_ISSUER = 'https://auth.test/realms/citybox-admin';
    process.env.KEYCLOAK_CLIENT_ID = 'admin-web';
    process.env.KEYCLOAK_PROVISIONING_CLIENT_ID = 'admin-provisioning';
    process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET = 'secret';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL_ENV)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL_ENV);
    jest.restoreAllMocks();
  });

  function mockAdminToken() {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.body instanceof URLSearchParams) {
        return {
          ok: true,
          json: async () => ({ access_token: 'admin-token', expires_in: 60 }),
        };
      }
      return { ok: true, text: async () => '' };
    });
  }

  it('createStoreBackofficeUser respeita emailVerified quando senha provisória', async () => {
    mockAdminToken();
    let createBody: Record<string, unknown> | null = null;

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.body instanceof URLSearchParams) {
        return {
          ok: true,
          json: async () => ({ access_token: 'admin-token', expires_in: 60 }),
        };
      }
      if (init?.method === 'POST' && url.endsWith('/users')) {
        createBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return {
          ok: true,
          headers: new Headers({
            location: '/admin/realms/citybox-admin/users/kc-new',
          }),
        };
      }
      if (url.includes('/users?')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: true, text: async () => '' };
    });

    const svc = new KeycloakAdminService();
    await svc.createStoreBackofficeUser({
      username: 'ana.silva',
      firstName: 'Ana',
      lastName: 'Silva',
      emailVerified: true,
    });

    expect((createBody as Record<string, unknown> | null)?.emailVerified).toBe(
      true,
    );
  });

  it('setProvisionalPassword prepara usuário e define senha temporária', async () => {
    const calls: Array<{ method?: string; url: string; body?: unknown }> = [];

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.body instanceof URLSearchParams) {
        return {
          ok: true,
          json: async () => ({ access_token: 'admin-token', expires_in: 60 }),
        };
      }

      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method: init?.method, url, body });

      if (
        (!init?.method || init.method === 'GET') &&
        url.endsWith('/users/kc-1')
      ) {
        return {
          ok: true,
          json: async () => ({
            id: 'kc-1',
            username: 'ana.silva',
            emailVerified: false,
            requiredActions: ['VERIFY_EMAIL'],
          }),
        };
      }

      if (url.endsWith('/reset-password')) {
        return { ok: true, text: async () => '' };
      }

      if (init?.method === 'PUT' || init?.method === 'POST') {
        return { ok: true, text: async () => '' };
      }

      return { ok: true, text: async () => '' };
    });

    const svc = new KeycloakAdminService();
    await svc.setProvisionalPassword('kc-1', 'TempPass12');

    const putBodies = calls
      .filter(
        (c) => c.method === 'PUT' && c.url.endsWith('/users/kc-1') && c.body,
      )
      .map((c) => c.body as Record<string, unknown>)
      .filter((body) => 'emailVerified' in body || 'requiredActions' in body);

    expect(putBodies[0]).toMatchObject({
      emailVerified: true,
      requiredActions: [],
    });
    expect(putBodies[1]).toMatchObject({
      requiredActions: ['UPDATE_PASSWORD'],
    });

    const resetCall = calls.find((c) => c.url.endsWith('/reset-password'));
    expect(resetCall?.body).toMatchObject({
      type: 'password',
      value: 'TempPass12',
      temporary: true,
    });
  });

  // O teste de `ensureVerticalBackofficeAccess` saiu com o ADR C-16: o método
  // atribuía client roles `vertical.<slug>.view` do `citybox-backoffice`, que
  // não existem mais. `ensureRealmRole` agora só atribui roles do próprio realm.
  it('ensureRealmRole atribui realm role do citybox-admin', async () => {
    const assigned: unknown[] = [];

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.body instanceof URLSearchParams) {
        return {
          ok: true,
          json: async () => ({ access_token: 'admin-token', expires_in: 60 }),
        };
      }
      if (url.endsWith('/roles/platform_operator')) {
        return { ok: true, json: async () => ({ name: 'platform_operator' }) };
      }
      if (init?.method === 'POST' && url.includes('/role-mappings/realm')) {
        assigned.push(JSON.parse(String(init.body)));
        return { ok: true, text: async () => '' };
      }
      return { ok: true, text: async () => '' };
    });

    const svc = new KeycloakAdminService();
    await svc.ensureRealmRole('kc-user', 'platform_operator');

    expect(assigned).toEqual([[{ name: 'platform_operator' }]]);
  });

  // Issuer único (ADR C-17, bloco 1): sem `KEYCLOAK_INTERNAL_ISSUER`, sem lista
  // de fallback. O Admin REST bate no realm do próprio sistema e em nenhum outro.
  it('usa KEYCLOAK_ISSUER como único host do Admin REST', async () => {
    const urls: string[] = [];

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      urls.push(String(url));
      if (init?.body instanceof URLSearchParams) {
        return {
          ok: true,
          json: async () => ({ access_token: 'admin-token', expires_in: 60 }),
        };
      }
      if (url.includes('/users?')) {
        return { ok: true, json: async () => [] };
      }
      if (init?.method === 'POST' && String(url).includes('/users')) {
        return {
          ok: true,
          headers: new Headers({
            location:
              'https://auth.test/admin/realms/citybox-admin/users/kc-local',
          }),
        };
      }
      return { ok: true, text: async () => '' };
    });

    const svc = new KeycloakAdminService();
    await svc.createStoreBackofficeUser({
      username: 'equipe@citybox.com',
      email: 'equipe@citybox.com',
      firstName: 'A',
      lastName: 'B',
      emailVerified: true,
    });

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((u) => u.includes('auth.test/'))).toBe(true);
    expect(urls.every((u) => u.includes('citybox-admin'))).toBe(true);
  });

  it('falha explicitamente quando KEYCLOAK_ISSUER não está configurado', async () => {
    delete process.env.KEYCLOAK_ISSUER;
    const svc = new KeycloakAdminService();

    await expect(svc.findUserByEmail('a@b.com')).rejects.toThrow(
      'KEYCLOAK_ISSUER não configurado',
    );
  });
});
