import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('payment-api health contract', () => {
  it('expõe metadados de liveness esperados', () => {
    const payload = { ok: true, service: 'payment-api', version: '0.1.0' };
    assert.equal(payload.ok, true);
    assert.equal(payload.service, 'payment-api');
    assert.match(payload.version, /^\d+\.\d+\.\d+$/);
  });
});
