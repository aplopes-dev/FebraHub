import { describe, expect, it } from 'vitest';
import {
  toAvulsoDebitBody,
  toPatientFinancialEntry,
  toReceiveBody,
} from './patient-financial-entry-api-mappers';
import { EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES } from '../types/patient-financial-receive-form';
import type { PatientFinancialDebitFormValues } from '../types/patient-financial-debit-form';

describe('patient-financial-entry-api-mappers', () => {
  it('maps API summary to UI entry with debitDetail treatments', () => {
    const entry = toPatientFinancialEntry({
      id: 'entry-1',
      patientId: 'patient-1',
      date: '2026-07-10',
      name: 'Clareamento de João',
      valueCents: 80000,
      status: 'pending',
      debitDetail: {
        observations: 'Obs',
        treatments: [
          {
            id: 'row-1',
            planId: 'plan-1',
            treatmentId: 'tr-1',
            treatmentName: 'Clareamento',
            value: '800,00',
            professionalId: 'prof-1',
            toothNumber: 11,
          },
        ],
      },
    });

    expect(entry.debitDetail?.treatments[0]?.value).toBe('800,00');
    expect(entry.valueCents).toBe(80000);
  });

  it('maps paymentMethod from received summary', () => {
    const entry = toPatientFinancialEntry({
      id: 'entry-2',
      patientId: 'patient-1',
      date: '2026-07-10',
      name: 'Limpeza',
      valueCents: 10000,
      status: 'received',
      receivedAt: '2026-07-12',
      paymentMethod: 'pix',
    });

    expect(entry.paymentMethod).toBe('pix');
  });

  it('maps debit form to API body with valueCents', () => {
    const values: PatientFinancialDebitFormValues = {
      patientId: 'patient-1',
      dueDate: new Date('2026-08-10T12:00:00'),
      observations: 'Observação',
      treatments: [
        {
          id: 'row-1',
          planId: 'plan-1',
          treatmentId: 'tr-1',
          treatmentName: 'Clareamento',
          value: '150,50',
          professionalId: 'prof-1',
          toothNumber: 11,
        },
      ],
      installmentValue: '',
      savedAttachments: [],
      attachments: [],
    };

    const body = toAvulsoDebitBody(values);

    expect(body.dueDate).toBe('2026-08-10');
    expect(body.treatments[0]?.valueCents).toBe(15050);
  });

  it('maps receive form to API body', () => {
    const body = toReceiveBody({
      ...EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
      paymentMethod: 'pix',
      paidAmount: '100,00',
      receivedDate: new Date('2026-07-12T12:00:00'),
      cashRegisterId: 'caixa-1',
    });

    expect(body.paymentMethod).toBe('pix');
    expect(body.paidValueCents).toBe(10000);
    expect(body.receivedAt).toBe('2026-07-12');
  });
});
