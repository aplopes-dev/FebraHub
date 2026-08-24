import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatCoreMirrorSkip,
  truncateForLog,
} from '../src/orders/core-orders.service.ts';

describe('core-mirror log helpers', () => {
  it('truncateForLog keeps short bodies intact', () => {
    assert.equal(truncateForLog('  hello   world  '), 'hello world');
  });

  it('truncateForLog bounds long bodies', () => {
    const long = 'x'.repeat(600);
    const out = truncateForLog(long, 50);
    assert.equal(out.length, 51); // 50 + …
    assert.ok(out.endsWith('…'));
  });

  it('formatCoreMirrorSkip marks resilient fallback with order context', () => {
    const msg = formatCoreMirrorSkip({
      reason: 'http_error',
      consumerOrderId: 'CB-TEST',
      storeId: '00000000-0000-7000-8000-000000000001',
      status: 500,
      body: '{"statusCode":500,"message":"Internal server error"}',
    });
    assert.match(msg, /\[core-mirror\] skip \(resilient fallback\)/);
    assert.match(msg, /consumerOrderId=CB-TEST/);
    assert.match(msg, /httpStatus=500/);
    assert.match(msg, /Internal server error/);
    assert.match(msg, /consumer_order_kept; reconcile_later/);
    assert.doesNotMatch(msg, /failed:/i);
  });

  it('formatCoreMirrorSkip includes unreachable error message', () => {
    const msg = formatCoreMirrorSkip({
      reason: 'unreachable',
      consumerOrderId: 'CB-NET',
      storeId: 'store-1',
      errorMessage: 'fetch failed',
    });
    assert.match(msg, /reason=unreachable/);
    assert.match(msg, /error=fetch failed/);
  });
});
