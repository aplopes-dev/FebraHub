import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAsaasSubscriptionEvent,
  mapAsaasSubscriptionEventToInternal,
  mapAsaasSubscriptionStatus,
} from '../../src/modules/providers/asaas/asaas-subscription.mapper.js';

describe('asaas-subscription.mapper', () => {
  it('mapeia status Asaas subscription', () => {
    assert.equal(mapAsaasSubscriptionStatus('ACTIVE'), 'ACTIVE');
    assert.equal(mapAsaasSubscriptionStatus('INACTIVE'), 'PAUSED');
  });

  it('identifica eventos de subscription', () => {
    assert.equal(isAsaasSubscriptionEvent('SUBSCRIPTION_CREATED'), true);
    assert.equal(isAsaasSubscriptionEvent('PAYMENT_RECEIVED'), false);
  });

  it('mapeia eventos para webhooks internos', () => {
    assert.equal(mapAsaasSubscriptionEventToInternal('SUBSCRIPTION_CREATED'), 'payment.subscription.created');
    assert.equal(mapAsaasSubscriptionEventToInternal('SUBSCRIPTION_DELETED'), 'payment.subscription.cancelled');
  });
});
