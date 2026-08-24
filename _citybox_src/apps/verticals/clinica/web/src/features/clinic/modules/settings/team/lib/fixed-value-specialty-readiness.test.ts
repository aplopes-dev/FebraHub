import { describe, expect, it } from 'vitest';
import type { PlanSpecialtyItem } from '../../plans/types/clinic-plan-specialty';
import {
  getEnabledSpecialtyTreatments,
  isFixedValueSpecialtyMissingTreatments,
} from './fixed-value-specialty-readiness';
import { COMMISSION_SCOPE_ALL, type CommissionRule } from '../types/commission';

function specialty(
  overrides: Partial<PlanSpecialtyItem> & { id?: string } = {},
): PlanSpecialtyItem {
  return {
    id: overrides.id ?? 'spec-1',
    name: overrides.name ?? 'Disfunção Temporomandibular (DTM)',
    treatments: overrides.treatments ?? [],
  };
}

function rule(
  overrides: Partial<
    Pick<
      CommissionRule,
      'paymentTrigger' | 'commissionType' | 'planId' | 'specialtyId'
    >
  > = {},
): Pick<
  CommissionRule,
  'paymentTrigger' | 'commissionType' | 'planId' | 'specialtyId'
> {
  return {
    paymentTrigger: 'treatment_completed',
    commissionType: 'fixed_value',
    planId: 'plan-1',
    specialtyId: 'spec-1',
    ...overrides,
  };
}

describe('getEnabledSpecialtyTreatments', () => {
  it('retorna só tratamentos enabled', () => {
    const result = getEnabledSpecialtyTreatments(
      specialty({
        treatments: [
          {
            id: 't1',
            name: 'A',
            treatmentValue: 'R$ 10,00',
            treatmentCost: 'R$ 0,00',
            enabled: true,
            acceptsFaces: false,
          },
          {
            id: 't2',
            name: 'B',
            treatmentValue: 'R$ 20,00',
            treatmentCost: 'R$ 0,00',
            enabled: false,
            acceptsFaces: false,
          },
        ],
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('t1');
  });

  it('retorna [] quando specialty é null/undefined', () => {
    expect(getEnabledSpecialtyTreatments(null)).toEqual([]);
    expect(getEnabledSpecialtyTreatments(undefined)).toEqual([]);
  });
});

describe('isFixedValueSpecialtyMissingTreatments', () => {
  it('true quando valor fixo + especialidade sem tratamentos habilitados', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(rule(), specialty({ treatments: [] })),
    ).toBe(true);
  });

  it('false quando há ao menos um tratamento enabled', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(
        rule(),
        specialty({
          treatments: [
            {
              id: 't1',
              name: 'A',
              treatmentValue: 'R$ 10,00',
              treatmentCost: 'R$ 0,00',
              enabled: true,
              acceptsFaces: false,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('false para porcentagem', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(
        rule({ commissionType: 'percentage' }),
        specialty(),
      ),
    ).toBe(false);
  });

  it('false para aprovação de orçamento', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(
        rule({
          paymentTrigger: 'budget_approved',
          planId: '',
          specialtyId: '',
        }),
        specialty(),
      ),
    ).toBe(false);
  });

  it('false enquanto specialty ainda não resolveu (loading)', () => {
    expect(isFixedValueSpecialtyMissingTreatments(rule(), null)).toBe(false);
  });

  it('false com escopo Todos no plano', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(
        rule({ planId: COMMISSION_SCOPE_ALL, specialtyId: 'spec-1' }),
        specialty({ treatments: [] }),
      ),
    ).toBe(false);
  });

  it('false com escopo Todos na especialidade', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(
        rule({ planId: 'plan-1', specialtyId: COMMISSION_SCOPE_ALL }),
        specialty({ treatments: [] }),
      ),
    ).toBe(false);
  });

  it('false quando paymentTrigger é null (rascunho incompleto)', () => {
    expect(
      isFixedValueSpecialtyMissingTreatments(
        rule({ paymentTrigger: null }),
        specialty({ treatments: [] }),
      ),
    ).toBe(false);
  });
});
