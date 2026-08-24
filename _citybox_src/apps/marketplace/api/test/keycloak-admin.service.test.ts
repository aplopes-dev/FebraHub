import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { KeycloakAdminService } from '../src/identity/keycloak-admin.service.js';

const ORIGINAL_ENV = { ...process.env };

describe('KeycloakAdminService', () => {
  beforeEach(() => {
    process.env.KEYCLOAK_ISSUER = 'https://auth.test/realms/citybox-marketplace';
    delete process.env.KEYCLOAK_PROVISIONING_CLIENT_ID;
    delete process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    mock.restoreAll();
  });

  it('isConfigured retorna false sem credenciais', () => {
    const svc = new KeycloakAdminService();
    assert.equal(svc.isConfigured(), false);
  });

  it('isConfigured retorna true com credenciais', () => {
    process.env.KEYCLOAK_PROVISIONING_CLIENT_ID = 'marketplace-provisioning';
    process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET = 'secret';
    const svc = new KeycloakAdminService();
    assert.equal(svc.isConfigured(), true);
  });

  it('updateProfile não chama fetch quando input vazio', async () => {
    process.env.KEYCLOAK_PROVISIONING_CLIENT_ID = 'marketplace-provisioning';
    process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET = 'secret';
    const fetchMock = mock.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: 't', expires_in: 60 }),
    }));
    mock.method(globalThis, 'fetch', fetchMock);
    const svc = new KeycloakAdminService();
    await svc.updateProfile('user-1', {});
    assert.equal(fetchMock.mock.calls.length, 0);
  });

  it('updateProfile faz GET+PUT sem alterar username', async () => {
    process.env.KEYCLOAK_PROVISIONING_CLIENT_ID = 'marketplace-provisioning';
    process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET = 'secret';
    const bodies: string[] = [];
    const fetchMock = mock.fn(async (url: string, init?: RequestInit) => {
      if (init?.body instanceof URLSearchParams) {
        return { ok: true, json: async () => ({ access_token: 't', expires_in: 60 }) };
      }
      if (init?.method === 'PUT' && typeof init.body === 'string') {
        bodies.push(init.body);
        return { ok: true };
      }
      if (url.includes('/users/user-1') && (!init?.method || init.method === 'GET')) {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            username: 'lojista',
            email: 'maria@test.com',
            firstName: 'Maria',
            lastName: 'Silva',
          }),
        };
      }
      return { ok: true };
    });
    mock.method(globalThis, 'fetch', fetchMock);
    const svc = new KeycloakAdminService();
    await svc.updateProfile('user-1', { name: 'Maria Souza', email: 'maria@test.com' });
    assert.equal(bodies.length, 1);
    const putBody = JSON.parse(bodies[0]!) as Record<string, unknown>;
    assert.equal(putBody.username, 'lojista');
    assert.equal(putBody.firstName, 'Maria');
    assert.equal(putBody.lastName, 'Souza');
    assert.equal(putBody.enabled, undefined);
  });

  it('changeOwnPassword conclui com 204', async () => {
    mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 204 }));
    const svc = new KeycloakAdminService();
    await svc.changeOwnPassword('user-jwt', 'atual', 'nova-senha-1');
  });

  it('changeOwnPassword rejeita senha atual incorreta', async () => {
    mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 400 }));
    const svc = new KeycloakAdminService();
    await assert.rejects(
      () => svc.changeOwnPassword('user-jwt', 'errada', 'nova-senha-1'),
      /Senha atual incorreta/,
    );
  });

  it('changeOwnPassword propaga indisponibilidade do Keycloak', async () => {
    mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503 }));
    const svc = new KeycloakAdminService();
    await assert.rejects(
      () => svc.changeOwnPassword('user-jwt', 'atual', 'nova-senha-1'),
      /senha no Keycloak/,
    );
  });

  it('reutiliza token em cache', async () => {
    process.env.KEYCLOAK_PROVISIONING_CLIENT_ID = 'marketplace-provisioning';
    process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET = 'secret';
    let tokenCalls = 0;
    mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
      if (init?.body instanceof URLSearchParams) {
        tokenCalls += 1;
        return { ok: true, json: async () => ({ access_token: 'cached', expires_in: 3600 }) };
      }
      if (url.includes('/users/user-1') && (!init?.method || init.method === 'GET')) {
        return {
          ok: true,
          json: async () => ({ id: 'user-1', username: 'lojista', email: 'a@test.com' }),
        };
      }
      return { ok: true };
    });
    const svc = new KeycloakAdminService();
    await svc.updateProfile('user-1', { name: 'A' });
    await svc.updateProfile('user-1', { email: 'a@test.com' });
    assert.equal(tokenCalls, 1);
  });

});
