import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeWebhookUrl } from '../src/common/security/webhook-url.js';

function withEnv(
  env: Record<string, string | undefined>,
  fn: () => void,
): void {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe('assertSafeWebhookUrl', () => {
  it('aceita HTTPS público', () => {
    assert.doesNotThrow(() => assertSafeWebhookUrl('https://api.example.com/webhooks'));
  });

  it('rejeita metadata AWS em produção', () => {
    withEnv({ NODE_ENV: 'production' }, () => {
      assert.throws(
        () => assertSafeWebhookUrl('https://169.254.169.254/latest/meta-data'),
        /privado/,
      );
    });
  });

  it('rejeita HTTP em produção', () => {
    withEnv({ NODE_ENV: 'production' }, () => {
      assert.throws(
        () => assertSafeWebhookUrl('http://hooks.example.com/payments'),
        /HTTPS/,
      );
    });
  });

  it('permite HTTP interno Docker em produção com allowlist', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        PAYMENT_API_IN_DOCKER: 'true',
        PAYMENT_API_DOCKER_ALLOWED_HOSTS: 'citybox_core_api',
      },
      () => {
        assert.doesNotThrow(() =>
          assertSafeWebhookUrl('http://citybox_core_api:3101/api/v1/internal/payments/webhooks'),
        );
      },
    );
  });

  it('rejeita hostname arbitrário mesmo com PAYMENT_API_IN_DOCKER', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        PAYMENT_API_IN_DOCKER: 'true',
        PAYMENT_API_DOCKER_ALLOWED_HOSTS: 'citybox_core_api',
      },
      () => {
        assert.throws(
          () => assertSafeWebhookUrl('http://postgres:5432/'),
          /HTTPS/,
        );
      },
    );
  });

  it('rejeita FQDN externo HTTP mesmo com PAYMENT_API_IN_DOCKER', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        PAYMENT_API_IN_DOCKER: 'true',
        PAYMENT_API_DOCKER_ALLOWED_HOSTS: 'citybox_core_api',
      },
      () => {
        assert.throws(
          () => assertSafeWebhookUrl('http://api.external-evil.com/hook'),
          /HTTPS/,
        );
      },
    );
  });

  it('rejeita HTTP para IP privado mesmo com PAYMENT_API_IN_DOCKER', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        PAYMENT_API_IN_DOCKER: 'true',
        PAYMENT_API_DOCKER_ALLOWED_HOSTS: 'citybox_core_api',
      },
      () => {
        assert.throws(
          () => assertSafeWebhookUrl('http://127.0.0.1:3101/api/v1/internal/payments/webhooks'),
          /HTTPS|privado/,
        );
      },
    );
  });
});
