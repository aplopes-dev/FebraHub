import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapPagBankEventToInternalWebhook,
  mapPagBankPaymentStatus,
  mapPagBankToPaymentStatus,
} from '../../src/modules/providers/pagbank/pagbank-status.mapper.js';

describe('pagbank-status.mapper', () => {
  it('mapeia status PagBank para status canônicos', () => {
    assert.equal(mapPagBankPaymentStatus('PAID'), 'PAID');
    assert.equal(mapPagBankPaymentStatus('AUTHORIZED'), 'AUTHORIZED');
    assert.equal(mapPagBankPaymentStatus('WAITING'), 'WAITING_PAYMENT');
    assert.equal(mapPagBankPaymentStatus('DECLINED'), 'FAILED');
    assert.equal(mapPagBankPaymentStatus('CANCELED'), 'CANCELLED');
  });

  it('mapeia status para payment e webhooks internos', () => {
    assert.equal(mapPagBankToPaymentStatus('PAID'), 'PAID');
    assert.equal(mapPagBankEventToInternalWebhook('PAID'), 'payment.payment.received');
    assert.equal(mapPagBankEventToInternalWebhook('DECLINED'), 'payment.payment.failed');
  });
});
