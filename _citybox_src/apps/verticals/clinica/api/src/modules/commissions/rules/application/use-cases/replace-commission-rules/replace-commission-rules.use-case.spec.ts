import { CommissionBudgetApprovedDuplicateError } from '../../../domain/errors/commission-budget-approved-duplicate.error';
import { CommissionFixedValueExceedsTreatmentError } from '../../../domain/errors/commission-fixed-value-exceeds-treatment.error';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { InMemoryCommissionRuleRepository } from '../../../tests/in-memory-commission-rule.repository';
import { GetCommissionRulesUseCase } from '../get-commission-rules/get-commission-rules.use-case';
import { ReplaceCommissionRulesUseCase } from './replace-commission-rules.use-case';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';

describe('ReplaceCommissionRulesUseCase', () => {
  let repository: InMemoryCommissionRuleRepository;
  let replaceRules: ReplaceCommissionRulesUseCase;
  let getRules: GetCommissionRulesUseCase;

  beforeEach(() => {
    repository = new InMemoryCommissionRuleRepository();
    replaceRules = new ReplaceCommissionRulesUseCase(repository);
    getRules = new GetCommissionRulesUseCase(repository);
  });

  it('replaces all rules for a member atomically', async () => {
    const saved = await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      rules: [
        {
          paymentTrigger: 'treatment_completed',
          commissionType: 'percentage',
          percentageValue: 10,
        },
        {
          paymentTrigger: 'debit_received',
          commissionType: 'fixed_value',
          commissionValueCents: 500,
          allowValueExceedsTreatment: true,
          treatments: [
            { treatmentId: 'tx-1', amountCents: 500, treatmentValueCents: 100 },
          ],
        },
      ],
    });

    expect(saved).toHaveLength(2);
    const loaded = await getRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
    });
    expect(loaded).toHaveLength(2);
  });

  it('replacing again removes previous rules (atomic replace)', async () => {
    await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      rules: [
        {
          paymentTrigger: 'treatment_completed',
          commissionType: 'percentage',
          percentageValue: 10,
        },
      ],
    });

    const secondReplace = await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      rules: [
        {
          paymentTrigger: 'debit_received',
          commissionType: 'percentage',
          percentageValue: 5,
        },
      ],
    });

    expect(secondReplace).toHaveLength(1);
    const loaded = await getRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
    });
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.paymentTrigger).toBe('debit_received');
  });

  it('rejects more than one budget_approved rule', async () => {
    await expect(
      replaceRules.execute({
        storeId: STORE_ID,
        memberId: MEMBER_ID,
        memberName: 'Dra. Ana',
        rules: [
          {
            paymentTrigger: 'budget_approved',
            commissionType: 'percentage',
            percentageValue: 10,
          },
          {
            paymentTrigger: 'budget_approved',
            commissionType: 'fixed_value',
            commissionValueCents: 1000,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(CommissionBudgetApprovedDuplicateError);
  });

  it('clears planId/specialtyId/treatments for budget_approved rules', async () => {
    const saved = await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      rules: [
        {
          paymentTrigger: 'budget_approved',
          commissionType: 'percentage',
          percentageValue: 10,
          planId: 'plan-1',
          specialtyId: 'spec-1',
          treatments: [
            { treatmentId: 'tx-1', amountCents: 100, treatmentValueCents: 100 },
          ],
        },
      ],
    });

    expect(saved[0]?.planId).toBeNull();
    expect(saved[0]?.specialtyId).toBeNull();
    expect(saved[0]?.treatments).toEqual([]);
  });

  it('rejects fixed_value amount exceeding treatment value when not allowed', async () => {
    await expect(
      replaceRules.execute({
        storeId: STORE_ID,
        memberId: MEMBER_ID,
        memberName: 'Dra. Ana',
        rules: [
          {
            paymentTrigger: 'treatment_completed',
            commissionType: 'fixed_value',
            commissionValueCents: 500,
            allowValueExceedsTreatment: false,
            treatments: [
              {
                treatmentId: 'tx-1',
                amountCents: 500,
                treatmentValueCents: 100,
              },
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(CommissionFixedValueExceedsTreatmentError);
  });

  it('allows fixed_value amount exceeding treatment value when explicitly allowed', async () => {
    const saved = await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      rules: [
        {
          paymentTrigger: 'treatment_completed',
          commissionType: 'fixed_value',
          commissionValueCents: 500,
          allowValueExceedsTreatment: true,
          treatments: [
            { treatmentId: 'tx-1', amountCents: 500, treatmentValueCents: 100 },
          ],
        },
      ],
    });

    expect(saved).toHaveLength(1);
  });

  it('allows fixed_value by treatment without commissionValueCents', async () => {
    const saved = await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Operador',
      rules: [
        {
          paymentTrigger: 'debit_received',
          commissionType: 'fixed_value',
          commissionValueCents: null,
          planId: 'plan-1',
          specialtyId: 'spec-1',
          treatments: [
            {
              treatmentId: 'tx-1',
              amountCents: 2000,
              treatmentValueCents: 10000,
            },
          ],
        },
      ],
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]?.commissionValueCents).toBeNull();
    expect(saved[0]?.treatments).toHaveLength(1);
  });

  it('deduplicates rules with the same identity keeping the last', async () => {
    const saved = await replaceRules.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Operador',
      rules: [
        {
          paymentTrigger: 'debit_received',
          commissionType: 'fixed_value',
          planId: 'plan-1',
          specialtyId: 'spec-1',
          treatments: [
            {
              treatmentId: 'tx-1',
              amountCents: 1300,
              treatmentValueCents: 10000,
            },
          ],
        },
        {
          paymentTrigger: 'debit_received',
          commissionType: 'fixed_value',
          planId: 'plan-1',
          specialtyId: 'spec-1',
          treatments: [
            {
              treatmentId: 'tx-1',
              amountCents: 1900,
              treatmentValueCents: 10000,
            },
          ],
        },
      ],
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]?.treatments[0]?.amountCents).toBe(1900);
  });

  it('rejects budget_approved fixed_value without commissionValueCents', async () => {
    await expect(
      replaceRules.execute({
        storeId: STORE_ID,
        memberId: MEMBER_ID,
        memberName: 'Operador',
        rules: [
          {
            paymentTrigger: 'budget_approved',
            commissionType: 'fixed_value',
            commissionValueCents: null,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
