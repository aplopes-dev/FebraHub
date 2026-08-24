import { describe, expect, it } from 'vitest';
import {
  buildPatientAnamnesisPublicLink,
  buildPatientAnamnesisWhatsAppUrl,
  getPatientAnamnesisLinkExpiresAt,
  PATIENT_ANAMNESIS_LINK_EXPIRY_LABEL,
} from './build-patient-anamnesis-public-link';

describe('buildPatientAnamnesisPublicLink', () => {
  it('builds link under /public/clinic/anamnese/', () => {
    expect(
      buildPatientAnamnesisPublicLink('http://localhost:3113', 'abc-123'),
    ).toBe('http://localhost:3113/public/clinic/anamnese/abc-123');
  });

  it('strips trailing slash from origin', () => {
    expect(
      buildPatientAnamnesisPublicLink('http://localhost:3113/', 'abc-123'),
    ).toBe('http://localhost:3113/public/clinic/anamnese/abc-123');
  });
});

describe('getPatientAnamnesisLinkExpiresAt', () => {
  it('expires 30 days after reference date', () => {
    const expiresAt = getPatientAnamnesisLinkExpiresAt(new Date('2026-06-01T12:00:00.000Z'));
    expect(expiresAt).toBe('2026-07-01T12:00:00.000Z');
  });
});

describe('buildPatientAnamnesisWhatsAppUrl', () => {
  it('builds wa.me url with encoded message', () => {
    const url = buildPatientAnamnesisWhatsAppUrl(
      '(73) 99999-0000',
      'Maria Silva',
      'http://localhost:3113/public/clinic/anamnese/abc',
    );

    expect(url).toContain('https://wa.me/5573999990000?text=');
    expect(url).toContain(encodeURIComponent('Maria Silva'));
  });

  it('returns null when phone is empty', () => {
    expect(
      buildPatientAnamnesisWhatsAppUrl('', 'Maria Silva', 'http://example.com'),
    ).toBeNull();
  });
});

describe('PATIENT_ANAMNESIS_LINK_EXPIRY_LABEL', () => {
  it('mentions 30 days', () => {
    expect(PATIENT_ANAMNESIS_LINK_EXPIRY_LABEL).toBe('Link expira em 30 dias');
  });
});
