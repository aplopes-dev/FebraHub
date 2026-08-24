import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reminderFingerprint } from './read-reminders-store';

describe('reminderFingerprint', () => {
  it('keeps same-title new leads distinct by href', () => {
    const a = reminderFingerprint({
      kind: 'new-lead',
      title: 'Novo lead',
      description: 'WhatsApp',
      href: '/leads/1',
    });
    const b = reminderFingerprint({
      kind: 'new-lead',
      title: 'Novo lead',
      description: 'WhatsApp',
      href: '/leads/2',
    });
    assert.notEqual(a, b);
  });
});
