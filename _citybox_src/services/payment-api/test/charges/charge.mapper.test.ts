import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapProviderStatusToChargeStatus,
  toChargeResponse,
} from '../../src/modules/charges/charge.mapper.js';

describe('charge.mapper', () => {
  it('mapProviderStatusToChargeStatus aceita status canônicos', () => {
    assert.equal(mapProviderStatusToChargeStatus('WAITING_PAYMENT'), 'WAITING_PAYMENT');
    assert.equal(mapProviderStatusToChargeStatus('UNKNOWN'), 'CREATED');
  });

  it('toChargeResponse serializa charge', () => {
    const response = toChargeResponse(
      {
        id: 'c1',
        status: 'WAITING_PAYMENT',
        provider: 'STUB',
        providerChargeId: 'stub_1',
        sourceSystem: 'core-api',
        externalReference: 'REF-1',
        merchantId: 'm1',
        amount: { toString: () => '100.50' },
        currency: 'BRL',
        dueDate: new Date('2026-06-20'),
        expiresAt: null,
        paymentUrl: 'https://example.com',
        metadataJson: { foo: 'bar' },
        createdAt: new Date('2026-06-11T10:00:00Z'),
        updatedAt: new Date('2026-06-11T10:00:00Z'),
      } as never,
      { paymentMethods: ['PIX'], pix: { copyPaste: 'abc' } },
    );
    assert.equal(response.id, 'c1');
    assert.equal(response.amount, 100.5);
    assert.equal(response.pix?.copyPaste, 'abc');
  });
});
