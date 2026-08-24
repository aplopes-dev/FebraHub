import { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';
import {
  allocatePaidValueAcrossItems,
  baseCommissionTreatmentName,
  buildDebitCommissionMatches,
  calculateDebitCommissionCents,
  formatCommissionTreatmentName,
  matchDebitReceivedRule,
  resolveInstallmentLabel,
  type DebitReceivedLineItem,
} from './debit-received-commission.math';

const STORE = 'store-1';
const MEMBER = 'member-1';

function makeItem(
  overrides: Partial<DebitReceivedLineItem> = {},
): DebitReceivedLineItem {
  return {
    professionalId: MEMBER,
    professionalName: 'Danillo',
    planId: 'plan-1',
    planName: 'Particular',
    treatmentId: 'treat-1',
    treatmentName: 'Extração',
    specialtyId: 'spec-1',
    specialtyName: 'Cirurgia',
    itemValueCents: 100_000,
    treatmentCostCents: 20_000,
    ...overrides,
  };
}

function makePercentageRule(
  overrides: Partial<{
    planId: string | null;
    specialtyId: string | null;
  }> = {},
): CommissionRule {
  return CommissionRule.create(
    {
      storeId: STORE,
      memberId: MEMBER,
      memberName: 'Danillo',
      paymentTrigger: 'debit_received',
      commissionType: 'percentage',
      percentageValue: 10,
      planId: overrides.planId === undefined ? 'plan-1' : overrides.planId,
      specialtyId:
        overrides.specialtyId === undefined ? 'spec-1' : overrides.specialtyId,
    },
    'rule-pct',
  );
}

function makeFixedRule(): CommissionRule {
  return CommissionRule.create(
    {
      storeId: STORE,
      memberId: MEMBER,
      memberName: 'Danillo',
      paymentTrigger: 'debit_received',
      commissionType: 'fixed_value',
      planId: 'plan-1',
      specialtyId: 'spec-1',
      treatments: [
        {
          treatmentId: 'treat-1',
          amountCents: 5_000,
          treatmentValueCents: 100_000,
        },
      ],
    },
    'rule-fixed',
  );
}

describe('formatCommissionTreatmentName', () => {
  it('anexa o dente/região ao nome do tratamento', () => {
    expect(formatCommissionTreatmentName('Cirurgia com Retalho', 15)).toBe(
      'Cirurgia com Retalho 15',
    );
    expect(formatCommissionTreatmentName('Extração', '35')).toBe('Extração 35');
  });

  it('não duplica o rótulo quando já está no nome', () => {
    expect(formatCommissionTreatmentName('Extração 15', '15')).toBe('Extração 15');
  });

  it('mantém só o nome quando não há localização', () => {
    expect(formatCommissionTreatmentName('Consulta', null)).toBe('Consulta');
    expect(formatCommissionTreatmentName('Consulta', '')).toBe('Consulta');
  });
});

describe('baseCommissionTreatmentName', () => {
  it('remove o número do dente do final para o cabeçalho', () => {
    expect(baseCommissionTreatmentName('Prpopropao 12')).toBe('Prpopropao');
    expect(baseCommissionTreatmentName('Cirurgia com Retalho 15')).toBe(
      'Cirurgia com Retalho',
    );
  });

  it('mantém o nome quando não há sufixo numérico', () => {
    expect(baseCommissionTreatmentName('Consulta')).toBe('Consulta');
  });
});

describe('debit-received-commission.math', () => {
  it('allocates paid value proportionally across items', () => {
    const allocated = allocatePaidValueAcrossItems(
      [
        makeItem({ itemValueCents: 100_000 }),
        makeItem({ treatmentId: 'treat-2', itemValueCents: 100_000 }),
      ],
      200_000,
    );
    expect(allocated).toHaveLength(2);
    expect(allocated[0]?.itemPaidValueCents).toBe(100_000);
    expect(allocated[1]?.itemPaidValueCents).toBe(100_000);
  });

  it('matches percentage rule by plan + specialty', () => {
    const rule = matchDebitReceivedRule([makePercentageRule()], makeItem());
    expect(rule?.id).toBe('rule-pct');
  });

  it('does not match when specialty differs', () => {
    const rule = matchDebitReceivedRule(
      [makePercentageRule()],
      makeItem({ specialtyId: 'other-spec' }),
    );
    expect(rule).toBeNull();
  });

  it('matches wildcard plan by specialty name across plans', () => {
    const wildcardRule = makePercentageRule({
      planId: null,
      specialtyId: 'spec-from-plan-a',
    });
    const item = makeItem({
      planId: 'plan-b',
      specialtyId: 'spec-from-plan-b',
      specialtyName: 'Ortodontia',
    });
    const specialtyNameById = new Map([
      ['spec-from-plan-a', 'Ortodontia'],
    ]);
    expect(
      matchDebitReceivedRule([wildcardRule], item, specialtyNameById)?.id,
    ).toBe('rule-pct');
  });

  it('does not match wildcard plan when specialty names differ', () => {
    const wildcardRule = makePercentageRule({
      planId: null,
      specialtyId: 'spec-from-plan-a',
    });
    const item = makeItem({
      specialtyId: 'spec-from-plan-b',
      specialtyName: 'Endodontia',
    });
    const specialtyNameById = new Map([
      ['spec-from-plan-a', 'Ortodontia'],
    ]);
    expect(
      matchDebitReceivedRule([wildcardRule], item, specialtyNameById),
    ).toBeNull();
  });

  it('calculates 10% of allocated paid value', () => {
    const cents = calculateDebitCommissionCents(
      makePercentageRule(),
      makeItem(),
      200_000,
    );
    expect(cents).toBe(20_000);
  });

  it('prorates fixed commission by paid fraction of item', () => {
    // half of item paid → half of fixed amount
    const cents = calculateDebitCommissionCents(
      makeFixedRule(),
      makeItem({ itemValueCents: 100_000 }),
      50_000,
    );
    expect(cents).toBe(2_500);
  });

  it('builds matches ignoring payment method (any paid amount)', () => {
    const matches = buildDebitCommissionMatches(
      new Map([[MEMBER, [makePercentageRule()]]]),
      [makeItem({ itemValueCents: 200_000 })],
      200_000,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]?.commissionCents).toBe(20_000);
  });

  it('resolves installment label from description', () => {
    expect(
      resolveInstallmentLabel({
        description: '1/3 — Plano de Procedimento',
        installmentNumber: null,
        totalInstallments: null,
        installmentIndex: 1,
      }),
    ).toBe('1/3');
  });
});
