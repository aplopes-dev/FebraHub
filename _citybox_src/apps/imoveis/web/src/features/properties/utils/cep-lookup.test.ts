import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cepDigits, isValidCepDigits } from './cep-lookup';
import { parseMapCoordinate } from './map-coordinate';

describe('cepDigits', () => {
  it('rejects incomplete CEP', () => {
    assert.equal(isValidCepDigits(cepDigits('45600-00')), false);
    assert.equal(isValidCepDigits(cepDigits('abc')), false);
  });

  it('accepts 8 digits', () => {
    assert.equal(isValidCepDigits(cepDigits('45600-000')), true);
  });
});

describe('map caption / absence', () => {
  it('has no coords when mapCoordinate is empty', () => {
    assert.equal(parseMapCoordinate(''), null);
    assert.equal(parseMapCoordinate(undefined), null);
  });
});
