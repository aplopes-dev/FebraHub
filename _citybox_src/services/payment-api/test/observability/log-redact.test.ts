import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactForLogs } from '../../src/common/observability/log-redact.js';

describe('log-redact', () => {
  it('redige chaves sensíveis', () => {
    const sanitized = redactForLogs({
      apiKey: 'super-secret-key-value-here',
      token: 'abcdef0123456789abcdef01',
      chargeId: '019aff00-0000-7000-8000-000000000001',
    }) as Record<string, unknown>;

    assert.equal(sanitized.apiKey, '[REDACTED]');
    assert.equal(sanitized.token, '[REDACTED]');
    assert.equal(sanitized.chargeId, '019aff00-0000-7000-8000-000000000001');
  });

  it('redige JWT e secrets com caracteres especiais', () => {
    const sanitized = redactForLogs({
      payload: 'dev-payments-webhook-secret-min-32-chars!!',
      jwt: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.sig',
    }) as Record<string, unknown>;

    assert.equal(sanitized.payload, '[REDACTED_TOKEN]');
    assert.equal(sanitized.jwt, '[REDACTED_JWT]');
  });
});
