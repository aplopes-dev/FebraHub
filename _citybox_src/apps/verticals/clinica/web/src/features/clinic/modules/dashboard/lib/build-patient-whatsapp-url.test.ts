import { describe, expect, it } from 'vitest';
import { buildPatientWhatsAppUrl } from './build-patient-whatsapp-url';

describe('buildPatientWhatsAppUrl', () => {
  it('builds a Brazilian wa.me URL with a generic greeting', () => {
    const url = buildPatientWhatsAppUrl(
      '73999887766',
      'Ana Carolina Silva',
    );

    expect(url).toContain('https://wa.me/5573999887766?text=');
    expect(decodeURIComponent(url ?? '')).toContain('Olá Ana!');
  });

  it('returns null without a valid phone', () => {
    expect(buildPatientWhatsAppUrl('', 'Ana')).toBeNull();
    expect(buildPatientWhatsAppUrl('abc', 'Ana')).toBeNull();
  });
});
