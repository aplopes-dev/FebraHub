import { describe, expect, it } from 'vitest';
import { EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES } from '../types/patient-financial-receive-form';
import { validatePatientFinancialReceiveForm } from './validate-patient-financial-receive-form';

describe('validatePatientFinancialReceiveForm', () => {
  it('requires cheque fields when payment method is check', () => {
    const result = validatePatientFinancialReceiveForm({
      ...EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
      paymentMethod: 'check',
      paidAmount: 'R$ 100,00',
      receivedDate: new Date('2026-07-01T12:00:00'),
      cashRegisterId: 'caixa-001',
    });

    expect(result).toBe('Informe a data do cheque.');
  });

  it('accepts valid cash payment', () => {
    const result = validatePatientFinancialReceiveForm({
      ...EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
      paymentMethod: 'cash',
      paidAmount: 'R$ 100,00',
      receivedDate: new Date('2026-07-01T12:00:00'),
      cashRegisterId: 'caixa-001',
    });

    expect(result).toBeNull();
  });
});
