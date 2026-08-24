import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentMetricsService } from '../../src/common/observability/payment-metrics.service.js';

describe('PaymentMetricsService', () => {
  it('agrega counters por nome e labels', () => {
    const metrics = new PaymentMetricsService();
    metrics.increment('charges_created_total', { provider: 'ASAAS' });
    metrics.increment('charges_created_total', { provider: 'ASAAS' });
    metrics.increment('charges_created_total', { provider: 'PAGBANK' });
    metrics.increment('webhook_failures_total', { kind: 'internal' });

    const snapshot = metrics.snapshot();
    assert.equal(snapshot.charges_created_total, 3);
    assert.equal(snapshot.webhook_failures_total, 1);
    assert.ok(typeof snapshot._startedAt === 'string');
    assert.match(String(snapshot._note), /reset on restart/);

    const detailed = metrics.snapshotDetailed();
    assert.ok(detailed.some((row) => row.name === 'charges_created_total' && row.labels.provider === 'ASAAS' && row.value === 2));
  });
});
