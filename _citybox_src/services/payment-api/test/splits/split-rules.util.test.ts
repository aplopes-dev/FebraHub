import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import {
  resolveSplitAmounts,
  validateSplitRules,
} from '../../src/modules/splits/split-rules.util.js';
import {
  buildMultistoreChargeMetadata,
  buildMultistoreSplitRules,
} from '../../src/contracts/multistore-checkout.contract.js';

describe('split-rules.util', () => {
  it('resolve percentuais sobre valor da cobrança', () => {
    const resolved = resolveSplitAmounts(100, [
      { recipientId: 'store-1', type: 'PERCENTAGE', value: 85 },
      { recipientId: 'platform', type: 'PERCENTAGE', value: 15 },
    ]);
    assert.equal(resolved[0]!.amount, 85);
    assert.equal(resolved[1]!.amount, 15);
  });

  it('rejeita soma fixa acima do valor da cobrança', () => {
    assert.throws(
      () =>
        validateSplitRules(100, [
          { recipientId: 'a', type: 'FIXED', value: 60 },
          { recipientId: 'b', type: 'FIXED', value: 50 },
        ]),
      BadRequestException,
    );
  });

  it('rejeita percentual acima de 100', () => {
    assert.throws(
      () =>
        validateSplitRules(100, [{ recipientId: 'a', type: 'PERCENTAGE', value: 101 }]),
      BadRequestException,
    );
  });
});

describe('multistore-checkout.contract', () => {
  it('monta split 85/15 loja/plataforma', () => {
    const rules = buildMultistoreSplitRules({
      storeMerchantId: 'merchant-food-1',
      storeSharePercent: 85,
      platformRecipientId: 'platform-city',
    });
    assert.equal(rules.length, 2);
    assert.equal(rules[0]!.recipientId, 'merchant-food-1');
    assert.equal(rules[0]!.value, 85);
    assert.equal(rules[1]!.recipientId, 'platform-city');
    assert.equal(rules[1]!.value, 15);
  });

  it('metadata multiloja inclui orderId e storeId', () => {
    const metadata = buildMultistoreChargeMetadata('ord-99', 'store-42');
    assert.equal(metadata.orderId, 'ord-99');
    assert.equal(metadata.storeId, 'store-42');
    assert.equal(metadata.verticalIntegration, 'multistore-checkout');
  });
});
