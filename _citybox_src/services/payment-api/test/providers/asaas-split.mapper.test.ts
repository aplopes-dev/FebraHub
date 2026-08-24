import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAsaasSplitPayload } from '../../src/modules/providers/asaas/asaas-split.mapper.js';

describe('buildAsaasSplitPayload', () => {
  it('mapeia FIXED e PERCENTAGE com walletId', () => {
    const payload = buildAsaasSplitPayload([
      {
        recipientId: 'store',
        type: 'FIXED',
        amount: 80,
        providerWalletId: 'wallet-store',
      },
      {
        recipientId: 'platform',
        type: 'PERCENTAGE',
        percentage: 20,
        providerWalletId: 'wallet-platform',
      },
    ]);

    assert.deepEqual(payload, [
      { walletId: 'wallet-store', fixedValue: 80 },
      { walletId: 'wallet-platform', percentualValue: 20 },
    ]);
  });

  it('ignora regras sem providerWalletId', () => {
    const payload = buildAsaasSplitPayload([
      { recipientId: 'store', type: 'PERCENTAGE', percentage: 100 },
    ]);
    assert.equal(payload.length, 0);
  });
});
