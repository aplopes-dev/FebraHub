import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  amountsMatch,
  calculatePaymentAmounts,
  sameCalendarDay,
  settlementDaysForMethod,
} from '../../src/modules/payment-entries/payment-fees.util.js';

describe('payment-fees.util', () => {
  it('calcula gross, fee e net para provider', () => {
    const result = calculatePaymentAmounts(100, 'ASAAS');
    assert.equal(result.grossAmount, 100);
    assert.ok(result.feeAmount > 0);
    assert.equal(result.netAmount, result.grossAmount - result.feeAmount);
  });

  it('compara valores com tolerância', () => {
    assert.equal(amountsMatch(100, 100.005), true);
    assert.equal(amountsMatch(100, 100.02), false);
  });

  it('define dias de liquidação por método', () => {
    assert.equal(settlementDaysForMethod('PIX'), 1);
    assert.ok(settlementDaysForMethod('CREDIT_CARD') >= 1);
  });

  it('valida mesmo dia calendário', () => {
    const a = new Date('2026-06-11T10:00:00Z');
    const b = new Date('2026-06-11T22:00:00Z');
    assert.equal(sameCalendarDay(a, b), true);
  });
});
