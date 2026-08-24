import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatAgentLocation, formatCreciLabel } from './agent-display';

describe('agent-display', () => {
  it('prefixes CRECI when missing', () => {
    assert.equal(formatCreciLabel('12345-BA'), 'CRECI 12345-BA');
  });

  it('keeps existing CRECI prefix', () => {
    assert.equal(formatCreciLabel('CRECI/BA 12345'), 'CRECI/BA 12345');
  });

  it('formats location from city and state', () => {
    assert.equal(formatAgentLocation('Ilhéus', 'BA'), 'Ilhéus, BA');
  });

  it('returns null when location is empty', () => {
    assert.equal(formatAgentLocation('—', '—'), null);
  });
});
