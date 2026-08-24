import { describe, expect, it } from 'vitest';
import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';
import { mapPlanToBudgetTreatmentOptions } from './map-plan-to-budget-treatment-options';

const plan: ClinicPlan = {
  id: 'plan-api',
  name: 'Plano API',
  order: 1,
  status: 'active',
  isDefault: true,
  specialties: [
    {
      id: 'spec-1',
      name: 'Odonto',
      treatments: [
        {
          id: 'tr-api-1',
          name: 'Limpeza',
          treatmentValue: 'R$ 220,00',
          treatmentCost: 'R$ 50,00',
          enabled: true,
          acceptsFaces: true,
        },
        {
          id: 'tr-api-2',
          name: 'Inativo',
          treatmentValue: 'R$ 100,00',
          treatmentCost: 'R$ 10,00',
          enabled: false,
          acceptsFaces: false,
        },
      ],
    },
  ],
};

describe('mapPlanToBudgetTreatmentOptions', () => {
  it('maps only enabled treatments with parsed value cents', () => {
    const result = mapPlanToBudgetTreatmentOptions(plan);

    expect(result).toEqual([
      {
        id: 'tr-api-1',
        name: 'Limpeza',
        valueCents: 22000,
        acceptsFaces: true,
        specialtyName: 'Odonto',
        locationUiType: 'tooth',
      },
    ]);
  });
});
