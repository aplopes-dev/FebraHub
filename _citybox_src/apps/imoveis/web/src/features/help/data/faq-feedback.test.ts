import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFaqFeedbackMap, withFaqFeedbackVote } from './faq-feedback';

describe('parseFaqFeedbackMap', () => {
  it('reads only up/down votes', () => {
    const parsed = parseFaqFeedbackMap(
      JSON.stringify({ 'faq-a': 'up', 'faq-b': 'nope', nested: { x: 1 } }),
    );
    assert.deepEqual(parsed, { 'faq-a': 'up' });
  });

  it('returns empty on invalid JSON', () => {
    assert.deepEqual(parseFaqFeedbackMap('{'), {});
  });
});

describe('withFaqFeedbackVote', () => {
  it('does not mutate the previous map', () => {
    const current = { 'faq-a': 'up' as const };
    const next = withFaqFeedbackVote(current, 'faq-b', 'down');
    assert.deepEqual(current, { 'faq-a': 'up' });
    assert.deepEqual(next, { 'faq-a': 'up', 'faq-b': 'down' });
  });
});
