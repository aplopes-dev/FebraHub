import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TenantResolverService } from '../src/tenancy/tenant-resolver.service.js';

describe('TenantResolverService', () => {
  it('resolve retorna client singleton', async () => {
    const svc = new TenantResolverService();
    const { client } = await svc.resolve();
    assert.ok(client, 'client deve existir');
  });

  it('resolve retorna mesmo client em chamadas repetidas', async () => {
    const svc = new TenantResolverService();
    const a = await svc.resolve();
    const b = await svc.resolve();
    assert.equal(a.client, b.client);
  });
});
