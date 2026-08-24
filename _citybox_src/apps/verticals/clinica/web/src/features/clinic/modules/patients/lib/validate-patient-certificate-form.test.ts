import { describe, expect, it } from 'vitest';
import {
  hasPatientCertificateFormErrors,
  validatePatientCertificateForm,
} from './validate-patient-certificate-form';
import { EMPTY_PATIENT_CERTIFICATE_FORM_VALUES } from '../types/patient-certificate';

describe('validatePatientCertificateForm', () => {
  it('requires professional and date', () => {
    const errors = validatePatientCertificateForm(EMPTY_PATIENT_CERTIFICATE_FORM_VALUES);

    expect(errors.professionalId).toBeDefined();
    expect(errors.issuedDate).toBeDefined();
    expect(hasPatientCertificateFormErrors(errors)).toBe(true);
  });

  it('requires days count when type is days', () => {
    const errors = validatePatientCertificateForm({
      ...EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
      professionalId: 'prof-1',
      issuedDate: '2026-07-01',
      type: 'days',
      daysCount: '0',
    });

    expect(errors.daysCount).toBeDefined();
  });

  it('does not require days count for attendance type', () => {
    const errors = validatePatientCertificateForm({
      ...EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
      professionalId: 'prof-1',
      issuedDate: '2026-07-01',
      type: 'attendance',
      daysCount: '',
      startTime: '09:00',
      endTime: '10:00',
    });

    expect(errors.daysCount).toBeUndefined();
    expect(hasPatientCertificateFormErrors(errors)).toBe(false);
  });

  it('requires start and end time for attendance type', () => {
    const errors = validatePatientCertificateForm({
      ...EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
      professionalId: 'prof-1',
      issuedDate: '2026-07-01',
      type: 'attendance',
      startTime: '',
      endTime: '',
    });

    expect(errors.startTime).toBeDefined();
    expect(errors.endTime).toBeDefined();
  });

  it('requires end time after start time for attendance type', () => {
    const errors = validatePatientCertificateForm({
      ...EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
      professionalId: 'prof-1',
      issuedDate: '2026-07-01',
      type: 'attendance',
      startTime: '10:00',
      endTime: '09:00',
    });

    expect(errors.endTime).toBeDefined();
  });
});
