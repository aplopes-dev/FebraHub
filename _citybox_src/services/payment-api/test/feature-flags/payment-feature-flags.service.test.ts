import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentFeatureFlagsService } from '../../src/common/feature-flags/payment-feature-flags.service.js';

describe('PaymentFeatureFlagsService', () => {
  it('PAYMENTS_FEATURE_INFINITEPAY=true habilita flags InfinitePay', async () => {
    const previous = process.env.PAYMENTS_FEATURE_INFINITEPAY;
    process.env.PAYMENTS_FEATURE_INFINITEPAY = 'true';
    try {
      const svc = new PaymentFeatureFlagsService();
      assert.equal(await svc.isInfinitePayEnabled(), true);
      assert.equal(await svc.isInfiniteTapEnabled(), true);
    } finally {
      if (previous === undefined) delete process.env.PAYMENTS_FEATURE_INFINITEPAY;
      else process.env.PAYMENTS_FEATURE_INFINITEPAY = previous;
    }
  });
});
