import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapStoneChargeStatus,
  mapStoneToPaymentStatus,
} from '../../src/modules/providers/stone/stone-status.mapper.js';
import { resolveStoneHost } from '../../src/modules/providers/stone/stone.types.js';

describe('stone-status.mapper', () => {
  it('mapeia status Stone para canônicos', () => {
    assert.equal(mapStoneChargeStatus('authorized'), 'AUTHORIZED');
    assert.equal(mapStoneChargeStatus('paid'), 'CAPTURED');
    assert.equal(mapStoneChargeStatus('canceled'), 'CANCELLED');
  });

  it('mapeia CAPTURED para payment PAID', () => {
    assert.equal(mapStoneToPaymentStatus('CAPTURED'), 'PAID');
    assert.equal(mapStoneToPaymentStatus('AUTHORIZED'), 'AUTHORIZED');
  });
});

describe('stone.types resolveStoneHost', () => {
  it('usa host sandbox subadquirente por padrão', () => {
    const prev = process.env.STONE_BUSINESS_MODEL;
    delete process.env.STONE_BUSINESS_MODEL;
    try {
      assert.equal(
        resolveStoneHost({ apiKey: 'x', environment: 'SANDBOX' }),
        'sdx-payments.stone.com.br',
      );
    } finally {
      if (prev) process.env.STONE_BUSINESS_MODEL = prev;
    }
  });
});
