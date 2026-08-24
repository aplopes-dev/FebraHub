import { describe, expect, it } from 'vitest';
import { buildBirthdayWhatsAppUrl } from './build-birthday-whatsapp-url';

describe('buildBirthdayWhatsAppUrl', () => {
  it('builds wa.me url with country code and encoded message', () => {
    const url = buildBirthdayWhatsAppUrl('73988776655', 'Bruno Henrique Santos');

    expect(url).toContain('https://wa.me/5573988776655?text=');
    expect(url).toContain(encodeURIComponent('Bruno'));
    expect(url).toContain(encodeURIComponent('feliz aniversário'));
  });

  it('does not duplicate 55 prefix', () => {
    const url = buildBirthdayWhatsAppUrl('5573988776655', 'Bruno');
    expect(url).toMatch(/^https:\/\/wa\.me\/5573988776655\?text=/);
  });

  it('returns null when phone is empty', () => {
    expect(buildBirthdayWhatsAppUrl('', 'Bruno')).toBeNull();
    expect(buildBirthdayWhatsAppUrl('abc', 'Bruno')).toBeNull();
  });
});
