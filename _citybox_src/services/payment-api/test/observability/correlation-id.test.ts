import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paymentRequestContext, resolveCorrelationId } from '../../src/common/observability/correlation-id.context.js';

describe('correlation-id.context', () => {
  it('gera UUID quando header ausente', () => {
    const id = resolveCorrelationId(undefined);
    assert.match(id, /^[0-9a-f-]{36}$/i);
  });

  it('preserva header válido', () => {
    assert.equal(resolveCorrelationId('checkout-abc-123'), 'checkout-abc-123');
  });

  it('propaga correlationId no AsyncLocalStorage', () => {
    let captured: string | undefined;
    paymentRequestContext.run({ correlationId: 'corr-1' }, () => {
      captured = paymentRequestContext.getStore()?.correlationId;
    });
    assert.equal(captured, 'corr-1');
  });
});
