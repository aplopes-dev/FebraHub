import { describe, expect, it } from 'vitest';
import {
  formatPatientAnamnesisSignatureIssuedAt,
  PATIENT_ANAMNESIS_SIGNATURE_STATUS_LABEL,
} from './patient-anamnesis-ui';

describe('patient-anamnesis-ui', () => {
  it('labels unsigned as Sem assinatura', () => {
    expect(PATIENT_ANAMNESIS_SIGNATURE_STATUS_LABEL.unsigned).toBe('Sem assinatura');
    expect(PATIENT_ANAMNESIS_SIGNATURE_STATUS_LABEL.pending).toBe('Pendente');
  });

  it('formats signature issued date as dd/MM/yyyy', () => {
    expect(formatPatientAnamnesisSignatureIssuedAt('2026-08-20')).toBe('20/08/2026');
    expect(formatPatientAnamnesisSignatureIssuedAt('2026-08-20T15:30:00.000Z')).toBe(
      '20/08/2026',
    );
  });
});
