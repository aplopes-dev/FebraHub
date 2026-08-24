import { describe, expect, it } from 'vitest';
import { createEmptyCommissionRule } from '../data/commission-defaults';
import { COMMISSION_SCOPE_ALL } from '../types/commission';
import {
  mapApiCommissionRuleToForm,
  mapFormCommissionRulesToApi,
  type ApiCommissionRule,
} from './commission-rules.service';

function apiRule(overrides: Partial<ApiCommissionRule> = {}): ApiCommissionRule {
  return {
    id: 'api-1',
    memberId: 'member-1',
    memberName: 'Dr. Teste',
    paymentTrigger: 'debit_received',
    commissionType: 'percentage',
    percentageValue: 10,
    commissionValueCents: null,
    allowValueExceedsTreatment: false,
    planId: null,
    specialtyId: null,
    treatments: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('mapApiCommissionRuleToForm', () => {
  it('mapeia planId/specialtyId null de percentual para Todos', () => {
    const form = mapApiCommissionRuleToForm(apiRule());
    expect(form.planId).toBe(COMMISSION_SCOPE_ALL);
    expect(form.specialtyId).toBe(COMMISSION_SCOPE_ALL);
  });

  it('mantém null como vazio em valor fixo', () => {
    const form = mapApiCommissionRuleToForm(
      apiRule({
        commissionType: 'fixed_value',
        percentageValue: null,
        planId: null,
        specialtyId: null,
      }),
    );
    expect(form.planId).toBe('');
    expect(form.specialtyId).toBe('');
  });
});

describe('mapFormCommissionRulesToApi', () => {
  it('envia Todos como null na API', () => {
    const rule = {
      ...createEmptyCommissionRule('r1'),
      saved: true,
      paymentTrigger: 'treatment_completed' as const,
      commissionType: 'percentage' as const,
      percentageValue: 7.5,
      planId: COMMISSION_SCOPE_ALL,
      specialtyId: COMMISSION_SCOPE_ALL,
    };
    const [payload] = mapFormCommissionRulesToApi([rule]);
    expect(payload?.planId).toBeNull();
    expect(payload?.specialtyId).toBeNull();
  });
});
