import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseReconciliationCsv,
  reconciliationItemsToCsv,
} from '../../src/modules/reconciliation/reconciliation.utils.js';

describe('reconciliation.utils', () => {
  it('parseia CSV de extrato', () => {
    const csv = [
      'externalReference,amount,transactionDate',
      'ORDER-1,150.50,2026-06-11',
      'ORDER-2,99.00,2026-06-10',
    ].join('\n');
    const rows = parseReconciliationCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.externalReference, 'ORDER-1');
    assert.equal(rows[0]?.amount, 150.5);
  });

  it('exporta divergências para CSV', () => {
    const csv = reconciliationItemsToCsv([
      {
        id: 'item-1',
        externalReference: 'ORDER-1',
        providerReference: 'pay_1',
        amount: 100,
        expectedAmount: 100,
        differenceAmount: 0,
        status: 'MATCHED',
        transactionDate: '2026-06-11',
        matchNotes: null,
      },
    ]);
    assert.ok(csv.includes('ORDER-1'));
    assert.ok(csv.startsWith('id,externalReference'));
  });
});
