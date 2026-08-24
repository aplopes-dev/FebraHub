import { describe, expect, it } from 'vitest';
import {
  isPatientDetailTabValue,
  patientDetailDefaultHref,
  patientDetailTabHref,
  PATIENT_DETAIL_DEFAULT_TAB,
} from './patient-detail-tabs';

describe('patient-detail-tabs routes', () => {
  it('builds href for each tab segment', () => {
    expect(patientDetailTabHref('patient-1', 'tratamentos')).toBe(
      '/pacientes/patient-1/tratamentos',
    );
  });

  it('defaults to sobre tab', () => {
    expect(PATIENT_DETAIL_DEFAULT_TAB).toBe('sobre');
    expect(patientDetailDefaultHref('patient-1')).toBe('/pacientes/patient-1/sobre');
    expect(patientDetailTabHref('patient-1')).toBe('/pacientes/patient-1/sobre');
  });

  it('builds href for calculo-imc tab after sobre', () => {
    expect(patientDetailTabHref('patient-1', 'calculo-imc')).toBe(
      '/pacientes/patient-1/calculo-imc',
    );
  });

  it('validates tab slugs', () => {
    expect(isPatientDetailTabValue('orcamentos')).toBe(true);
    expect(isPatientDetailTabValue('calculo-imc')).toBe(true);
    expect(isPatientDetailTabValue('invalid')).toBe(false);
  });
});
