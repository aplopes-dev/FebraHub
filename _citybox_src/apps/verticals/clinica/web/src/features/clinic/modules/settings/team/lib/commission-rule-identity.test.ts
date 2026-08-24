import { describe, expect, it } from 'vitest';
import { createEmptyCommissionRule } from '../data/commission-defaults';
import {
  COMMISSION_SCOPE_ALL,
  type CommissionRule,
} from '../types/commission';
import {
  dedupeCommissionRulesByIdentity,
  findExistingBudgetApprovedRule,
  findMatchingCommissionRule,
  getCommissionRuleIdentityKey,
  prefillCommissionRuleFromExisting,
} from './commission-rule-identity';

function savedRule(overrides: Partial<CommissionRule> = {}): CommissionRule {
  return {
    ...createEmptyCommissionRule('rule-1'),
    saved: true,
    paymentTrigger: 'debit_received',
    commissionType: 'fixed_value',
    planId: 'plan-1',
    specialtyId: 'spec-1',
    treatmentCommissionValues: { 'tx-1': 'R$ 13,00' },
    ...overrides,
  };
}

describe('getCommissionRuleIdentityKey', () => {
  it('monta chave com gatilho, tipo, plano e especialidade', () => {
    expect(
      getCommissionRuleIdentityKey({
        paymentTrigger: 'debit_received',
        commissionType: 'fixed_value',
        planId: 'plan-1',
        specialtyId: 'spec-1',
      }),
    ).toBe('debit_received|fixed_value|plan-1|spec-1');
  });

  it('retorna null enquanto plano/especialidade estão incompletos', () => {
    expect(
      getCommissionRuleIdentityKey({
        paymentTrigger: 'debit_received',
        commissionType: 'fixed_value',
        planId: 'plan-1',
        specialtyId: '',
      }),
    ).toBeNull();
  });

  it('aceita Todos (COMMISSION_SCOPE_ALL) em regra percentual', () => {
    expect(
      getCommissionRuleIdentityKey({
        paymentTrigger: 'treatment_completed',
        commissionType: 'percentage',
        planId: COMMISSION_SCOPE_ALL,
        specialtyId: COMMISSION_SCOPE_ALL,
      }),
    ).toBe(
      `treatment_completed|percentage|${COMMISSION_SCOPE_ALL}|${COMMISSION_SCOPE_ALL}`,
    );
  });

  it('aceita plano concreto + Todas especialidades em percentual', () => {
    expect(
      getCommissionRuleIdentityKey({
        paymentTrigger: 'debit_received',
        commissionType: 'percentage',
        planId: 'plan-1',
        specialtyId: COMMISSION_SCOPE_ALL,
      }),
    ).toBe(`debit_received|percentage|plan-1|${COMMISSION_SCOPE_ALL}`);
  });

  it('rejeita Todos em valor fixo', () => {
    expect(
      getCommissionRuleIdentityKey({
        paymentTrigger: 'debit_received',
        commissionType: 'fixed_value',
        planId: COMMISSION_SCOPE_ALL,
        specialtyId: COMMISSION_SCOPE_ALL,
      }),
    ).toBeNull();
  });
});

describe('findMatchingCommissionRule / prefill', () => {
  it('encontra regra salva com a mesma identidade', () => {
    const existing = savedRule({ id: 'existing' });
    const draft = savedRule({
      id: 'draft',
      saved: false,
      treatmentCommissionValues: {},
    });
    expect(findMatchingCommissionRule([existing], draft)?.id).toBe('existing');
  });

  it('pré-preenche valores da regra existente', () => {
    const existing = savedRule({
      id: 'existing',
      treatmentCommissionValues: { 'tx-1': 'R$ 13,00' },
      allowValueExceedsTreatment: true,
    });
    const draft = createEmptyCommissionRule('draft');
    const filled = prefillCommissionRuleFromExisting(
      {
        ...draft,
        paymentTrigger: 'debit_received',
        commissionType: 'fixed_value',
        planId: 'plan-1',
        specialtyId: 'spec-1',
      },
      existing,
    );
    expect(filled.treatmentCommissionValues).toEqual({ 'tx-1': 'R$ 13,00' });
    expect(filled.allowValueExceedsTreatment).toBe(true);
  });

  it('encontra regra percentual com escopo Todos', () => {
    const existing = savedRule({
      id: 'all-pct',
      commissionType: 'percentage',
      percentageValue: 10,
      planId: COMMISSION_SCOPE_ALL,
      specialtyId: COMMISSION_SCOPE_ALL,
      treatmentCommissionValues: {},
    });
    const draft = savedRule({
      id: 'draft',
      saved: false,
      commissionType: 'percentage',
      planId: COMMISSION_SCOPE_ALL,
      specialtyId: COMMISSION_SCOPE_ALL,
      treatmentCommissionValues: {},
    });
    expect(findMatchingCommissionRule([existing], draft)?.id).toBe('all-pct');
  });
});

describe('findExistingBudgetApprovedRule', () => {
  it('encontra regra de aprovação mesmo sem tipo no rascunho', () => {
    const existing = savedRule({
      id: 'budget',
      paymentTrigger: 'budget_approved',
      commissionType: 'percentage',
      percentageValue: 15,
      planId: '',
      specialtyId: '',
      treatmentCommissionValues: {},
    });
    expect(findExistingBudgetApprovedRule([existing])?.id).toBe('budget');
  });
});

describe('dedupeCommissionRulesByIdentity', () => {
  it('mantém só a última regra por identidade', () => {
    const first = savedRule({
      id: 'first',
      treatmentCommissionValues: { 'tx-1': 'R$ 13,00' },
    });
    const second = savedRule({
      id: 'second',
      treatmentCommissionValues: { 'tx-1': 'R$ 19,00' },
    });
    const deduped = dedupeCommissionRulesByIdentity([first, second]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.id).toBe('second');
    expect(deduped[0]?.treatmentCommissionValues['tx-1']).toBe('R$ 19,00');
  });

  it('mantém regras com identidades diferentes', () => {
    const a = savedRule({ id: 'a', specialtyId: 'spec-1' });
    const b = savedRule({ id: 'b', specialtyId: 'spec-2' });
    expect(dedupeCommissionRulesByIdentity([a, b])).toHaveLength(2);
  });
});
