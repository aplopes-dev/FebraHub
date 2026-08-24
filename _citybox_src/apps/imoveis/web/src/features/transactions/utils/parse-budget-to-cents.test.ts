import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseBudgetRangeToCents,
  propertyCostToCents,
} from './parse-budget-to-cents';

describe('parseBudgetRangeToCents', () => {
  it('parses mil and mi', () => {
    assert.equal(parseBudgetRangeToCents('R$ 550 mil – 1,6 mi'), 55_000_000);
    assert.equal(parseBudgetRangeToCents('1,6 mi'), 160_000_000);
  });

  it('parses brazilian thousands', () => {
    assert.equal(parseBudgetRangeToCents('R$ 7.000'), 700_000);
  });

  it('returns undefined for empty or unparseable', () => {
    assert.equal(parseBudgetRangeToCents(''), undefined);
    assert.equal(parseBudgetRangeToCents('a combinar'), undefined);
  });
});

describe('propertyCostToCents', () => {
  it('converts listing cost in reais to cents', () => {
    assert.equal(propertyCostToCents(1_560_400), 156_040_000);
    assert.equal(propertyCostToCents(0), undefined);
  });
});
