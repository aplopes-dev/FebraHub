import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HealthController } from '../src/health/health.controller.js';

describe('HealthController', () => {
  const ctrl = new HealthController();

  it('liveness retorna ok', () => {
    assert.deepEqual(ctrl.liveness(), { ok: true, service: 'marketplace-api', version: '0.1.0' });
  });

  it('readiness retorna ready', () => {
    assert.deepEqual(ctrl.readiness(), { ok: true, ready: true, service: 'marketplace-api' });
  });
});
