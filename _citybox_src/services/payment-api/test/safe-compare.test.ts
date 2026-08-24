import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { safeCompare } from '../src/common/security/safe-compare.js';

describe('safeCompare', () => {
  it('retorna true para strings iguais', () => {
    assert.equal(safeCompare('abc', 'abc'), true);
  });

  it('retorna false para strings diferentes', () => {
    assert.equal(safeCompare('abc', 'abd'), false);
  });

  it('retorna false para tamanhos diferentes', () => {
    assert.equal(safeCompare('abc', 'abcd'), false);
  });
});
