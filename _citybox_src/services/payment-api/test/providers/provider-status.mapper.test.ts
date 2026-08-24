import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapProviderEventToChargeStatus,
  mapProviderEventToInternalWebhook,
  isProviderPaidChargeStatus,
} from '../../src/modules/providers/provider-status.mapper.js';

describe('provider-status.mapper', () => {
  it('delega mapeamento Asaas', () => {
    assert.equal(
      mapProviderEventToChargeStatus('ASAAS', 'PAYMENT_RECEIVED', 'RECEIVED'),
      'RECEIVED',
    );
    assert.equal(mapProviderEventToInternalWebhook('ASAAS', 'PAYMENT_RECEIVED'), 'payment.payment.received');
  });

  it('delega mapeamento PagBank', () => {
    assert.equal(mapProviderEventToChargeStatus('PAGBANK', 'CHARGE_PAID', 'PAID'), 'PAID');
    assert.equal(mapProviderEventToInternalWebhook('PAGBANK', 'CHARGE_PAID', 'PAID'), 'payment.payment.received');
    assert.equal(isProviderPaidChargeStatus('PAGBANK', 'PAID'), true);
  });
});
