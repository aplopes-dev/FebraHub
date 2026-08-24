import { describe, expect, it } from 'vitest';
import { formatToothLocationLabel, parseToothLocationLabel } from './tooth-location-label';
import { toPatientBudgetUpsertBody } from './patient-budget-api-mappers';
import type { PatientBudgetSheetSubmitPayload } from '../types/patient-budget-form';

describe('tooth-location-label', () => {
  it('formats and parses tooth faces', () => {
    const label = formatToothLocationLabel(15, ['M', 'O']);
    expect(label).toBe('15 · M,O/I');
    expect(parseToothLocationLabel(label)).toEqual({
      toothNumber: 15,
      faces: ['M', 'O'],
    });
  });
});

describe('toPatientBudgetUpsertBody tooth faces', () => {
  it('preserves faces in locationLabel for tooth items', () => {
    const payload: PatientBudgetSheetSubmitPayload = {
      description: 'Orçamento',
      responsibleId: 'resp-1',
      responsible: 'Dr. A',
      date: '2026-07-27',
      treatments: [
        {
          id: 'item-1',
          toothNumber: 15,
          locationType: 'tooth',
          locationLabel: '15 · M,O/I',
          treatmentId: 'tr-1',
          treatmentName: 'Restauração',
          professionalId: 'pro-1',
          professionalName: 'Dr. A',
          planId: 'plan-1',
          planName: 'Particular',
          valueCents: 10000,
        },
      ],
      finalValueCents: 10000,
      observations: '',
      discount: null,
      installmentConfig: {
        enabled: false,
        downPayment: '',
        installmentsCount: '',
      },
      installment: null,
      status: 'draft',
      rejection: null,
      emitContractOnApprove: false,
      printSettings: {
        totalValue: true,
        treatmentValues: true,
        installments: true,
        dentist: true,
      },
    };

    const body = toPatientBudgetUpsertBody(payload);
    expect(body.items[0]?.locationType).toBe('tooth');
    expect(body.items[0]?.locationLabel).toBe('15 · M,O/I');
  });
});
