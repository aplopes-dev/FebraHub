import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  asCreatablePaymentMethod,
  mapLeadPaymentIntentsToTransactionMethod,
} from './map-lead-payment-intent';

describe('mapLeadPaymentIntentsToTransactionMethod', () => {
  it('não preenche quando o lead não informou intenção', () => {
    assert.equal(mapLeadPaymentIntentsToTransactionMethod(undefined), undefined);
    assert.equal(mapLeadPaymentIntentsToTransactionMethod([]), undefined);
  });

  it('mapeia a primeira intenção para o meio do modal de fechamento', () => {
    assert.equal(mapLeadPaymentIntentsToTransactionMethod(['cash']), 'cash');
    assert.equal(
      mapLeadPaymentIntentsToTransactionMethod(['financing']),
      'financing',
    );
    assert.equal(mapLeadPaymentIntentsToTransactionMethod(['fgts']), 'fgts');
    assert.equal(
      mapLeadPaymentIntentsToTransactionMethod(['trade-in']),
      'trade-in',
    );
  });

  it('usa a primeira intenção quando houver mais de uma', () => {
    assert.equal(
      mapLeadPaymentIntentsToTransactionMethod(['financing', 'fgts']),
      'financing',
    );
  });
});

describe('asCreatablePaymentMethod', () => {
  it('aceita só os mesmos meios do formulário de lead', () => {
    assert.equal(asCreatablePaymentMethod('trade-in'), 'trade-in');
    assert.equal(asCreatablePaymentMethod('fgts'), 'fgts');
    assert.equal(asCreatablePaymentMethod('pix'), '');
    assert.equal(asCreatablePaymentMethod('check'), '');
    assert.equal(asCreatablePaymentMethod(undefined), '');
  });
});
