import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { UnauthorizedException } from '@nestjs/common';
import { DEV_TENANT_ID } from '../../src/dev/dev-constants.js';
import { ApiKeyService } from '../../src/common/auth/api-key.service.js';

describe('ApiKeyService', () => {
  const originalClients = process.env.PAYMENTS_API_CLIENTS;
  const originalKeys = process.env.PAYMENTS_API_KEYS;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.PAYMENTS_API_CLIENTS;
    delete process.env.PAYMENTS_API_KEYS;
    delete process.env.PAYMENTS_DEFAULT_TENANT_ID;
    delete process.env.PAYMENTS_DEV_CORE_API_KEY;
    delete process.env.PAYMENTS_DEV_ADMIN_API_KEY;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.PAYMENTS_API_CLIENTS = originalClients;
    process.env.PAYMENTS_API_KEYS = originalKeys;
    process.env.NODE_ENV = originalEnv;
  });

  it('resolve cliente dev core-api', () => {
    const svc = new ApiKeyService();
    const client = svc.resolve('dev-core-api-key');
    assert.equal(client.sourceSystem, 'core-api');
    assert.equal(client.tenantId, DEV_TENANT_ID);
    assert.equal(client.isAdmin, false);
  });

  it('resolve admin com flag isAdmin', () => {
    const svc = new ApiKeyService();
    const client = svc.resolve('dev-admin-key');
    assert.equal(client.sourceSystem, 'admin');
    assert.equal(client.isAdmin, true);
  });

  it('rejeita API key inválida', () => {
    const svc = new ApiKeyService();
    assert.throws(() => svc.resolve('invalid'), UnauthorizedException);
  });

  it('parse PAYMENTS_API_CLIENTS customizado', () => {
    process.env.PAYMENTS_API_CLIENTS = JSON.stringify({
      bff: { key: 'secret-bff', tenantId: 'tenant-1', admin: false },
    });
    const clients = ApiKeyService.parseClients();
    assert.equal(clients.length, 1);
    assert.equal(clients[0]?.sourceSystem, 'bff');
    assert.equal(clients[0]?.tenantId, 'tenant-1');
  });
});
