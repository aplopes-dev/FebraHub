import { describe, expect, it } from 'vitest';
import { toApiFinancialSort } from './sort-patient-financial-entries';

describe('toApiFinancialSort', () => {
  it('defaults to date desc when sort is null', () => {
    expect(toApiFinancialSort(null)).toEqual({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('maps value column to valueCents', () => {
    expect(toApiFinancialSort({ column: 'value', desc: true })).toEqual({
      sortBy: 'valueCents',
      sortOrder: 'desc',
    });
  });

  it('maps name column ascending', () => {
    expect(toApiFinancialSort({ column: 'name', desc: false })).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });
});
