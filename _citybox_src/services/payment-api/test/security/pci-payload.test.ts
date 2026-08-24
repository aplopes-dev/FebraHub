import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  digitsOnly,
  findPanViolations,
  looksLikePan,
  luhnCheck,
  sanitizePciForStorage,
} from '../../src/common/security/pci-payload.js';

describe('pci-payload', () => {
  it('valida Luhn para PAN de teste', () => {
    assert.equal(luhnCheck('4111111111111111'), true);
    assert.equal(luhnCheck('4111111111111112'), false);
  });

  it('detecta PAN em string', () => {
    assert.equal(looksLikePan('4111 1111 1111 1111'), true);
    assert.equal(looksLikePan('token-stone-abc'), false);
  });

  it('digitsOnly remove máscara', () => {
    assert.equal(digitsOnly('4111-1111-1111-1111'), '4111111111111111');
  });

  it('findPanViolations encontra PAN aninhado', () => {
    const violations = findPanViolations({
      metadata: { cardNumber: '4111111111111111' },
    });
    assert.ok(violations.length >= 1);
  });

  it('sanitizePciForStorage remove CVV e mascara PAN', () => {
    const sanitized = sanitizePciForStorage({
      stoneCard: { token: 'tok_abc', cvv: '123' },
      cardNumber: '4111111111111111',
    }) as Record<string, unknown>;

    assert.equal((sanitized.stoneCard as Record<string, string>).cvv, '[REDACTED]');
    assert.equal(sanitized.cardNumber, '[REDACTED_PAN]');
  });

  it('preserva token alfanumérico em stoneCard.number', () => {
    const sanitized = sanitizePciForStorage({
      stoneCard: { number: 'tok_stone_abc123', expirationDate: '12/30' },
    }) as Record<string, unknown>;
    assert.equal((sanitized.stoneCard as Record<string, string>).number, 'tok_stone_abc123');
  });
});
