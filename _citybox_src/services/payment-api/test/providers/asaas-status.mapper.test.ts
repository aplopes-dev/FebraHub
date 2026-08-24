import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapAsaasEventToChargeStatus,
  mapAsaasEventToInternalWebhook,
  mapAsaasPaymentStatus,
} from '../../src/modules/providers/asaas/asaas-status.mapper.js';

describe('asaas-status.mapper', () => {
  it('mapeia eventos Asaas para status canônicos', () => {
    assert.equal(mapAsaasEventToChargeStatus('PAYMENT_RECEIVED', 'RECEIVED'), 'RECEIVED');
    assert.equal(mapAsaasEventToChargeStatus('PAYMENT_OVERDUE', 'OVERDUE'), 'OVERDUE');
    assert.equal(mapAsaasPaymentStatus('PENDING'), 'WAITING_PAYMENT');
  });

  it('mapeia eventos para webhooks internos', () => {
    assert.equal(mapAsaasEventToInternalWebhook('PAYMENT_RECEIVED'), 'payment.payment.received');
    assert.equal(mapAsaasEventToInternalWebhook('PAYMENT_REFUNDED'), 'payment.payment.refunded');
  });
});
