import { describe, expect, it } from 'vitest';
import {
  formatPendingSignatureDaysLabel,
  formatSignatureRequestedAtDate,
  PATIENT_SIGNATURE_KIND_LABEL,
} from './patient-pending-signatures';

describe('PATIENT_SIGNATURE_KIND_LABEL', () => {
  it('labels the three signature kinds', () => {
    expect(PATIENT_SIGNATURE_KIND_LABEL.anamnesis).toBe('Anamnese');
    expect(PATIENT_SIGNATURE_KIND_LABEL.contract).toBe('Contrato');
    expect(PATIENT_SIGNATURE_KIND_LABEL.evolution_batch).toBe('Evolução');
  });
});

describe('formatPendingSignatureDaysLabel', () => {
  it('returns 0 dias pendentes for same civil day in clinic TZ', () => {
    // 2026-08-20 15:00 UTC = 12:00 BRT
    const now = new Date('2026-08-20T15:00:00.000Z');
    expect(
      formatPendingSignatureDaysLabel('2026-08-20T10:00:00.000Z', now),
    ).toBe('0 dias pendentes');
  });

  it('returns 1 dia pendente for previous civil day', () => {
    const now = new Date('2026-08-20T15:00:00.000Z');
    expect(
      formatPendingSignatureDaysLabel('2026-08-19T15:00:00.000Z', now),
    ).toBe('1 dia pendente');
  });

  it('returns N dias pendentes for older requests', () => {
    const now = new Date('2026-08-20T15:00:00.000Z');
    expect(
      formatPendingSignatureDaysLabel('2026-08-15T15:00:00.000Z', now),
    ).toBe('5 dias pendentes');
  });
});

describe('formatSignatureRequestedAtDate', () => {
  it('formats as dd/MM/yyyy in clinic TZ', () => {
    // Late UTC still same BRT day
    expect(formatSignatureRequestedAtDate('2026-08-20T14:00:00.000Z')).toBe(
      '20/08/2026',
    );
  });
});
