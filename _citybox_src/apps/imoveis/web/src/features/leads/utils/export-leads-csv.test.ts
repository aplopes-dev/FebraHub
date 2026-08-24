import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatPaymentIntentsCsv } from './export-leads-csv';

describe('formatPaymentIntentsCsv', () => {
  it('returns empty string when omitted or empty', () => {
    assert.equal(formatPaymentIntentsCsv(), '');
    assert.equal(formatPaymentIntentsCsv([]), '');
  });

  it('joins Portuguese labels without mutating order', () => {
    assert.equal(
      formatPaymentIntentsCsv(['financing', 'fgts']),
      'Financiamento bancário; FGTS',
    );
  });
});
