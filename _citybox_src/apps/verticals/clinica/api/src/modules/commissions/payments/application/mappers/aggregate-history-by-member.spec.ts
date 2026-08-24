import { CommissionAccrual } from '../../../accruals/domain/entities/commission-accrual.entity';
import { CommissionPayment } from '../../domain/entities/commission-payment.entity';
import { parseIsoDateOnly } from '../../../shared/domain/commission-date.utils';
import { aggregateHistoryByMember } from './aggregate-history-by-member';

const STORE = 'store-1';
const MEMBER = 'member-danillo';

function makeAccrual(id: string, commissionCents: number): CommissionAccrual {
  return CommissionAccrual.create(
    {
      storeId: STORE,
      memberId: MEMBER,
      memberName: 'Danillo Mota',
      paymentTrigger: 'debit_received',
      triggerLabel: 'Débito recebido do paciente',
      planName: 'Particular',
      specialtyName: 'Cirurgia',
      treatmentName: 'Extração',
      patientName: 'Paciente',
      paidValueCents: 100_000,
      treatmentCostCents: 10_000,
      commissionCents,
      accruedAt: parseIsoDateOnly('2026-07-15'),
      status: 'paid',
    },
    id,
  );
}

function makePayment(
  id: string,
  netCents: number,
  accrualIds: string[],
  paymentDate: string,
): CommissionPayment {
  return CommissionPayment.create(
    {
      storeId: STORE,
      memberId: MEMBER,
      memberName: 'Danillo Mota',
      description: `Comissão Danillo`,
      paymentDate: parseIsoDateOnly(paymentDate),
      accountId: 'acc-1',
      paymentMethod: 'pix',
      grossCents: netCents,
      discountCents: 0,
      netCents,
      accrualIds,
    },
    id,
  );
}

describe('aggregateHistoryByMember', () => {
  it('soma pagamentos do mesmo profissional numa única linha', () => {
    const a1 = makeAccrual('acc-1', 15_000);
    const a2 = makeAccrual('acc-2', 20_000);
    const summaries = aggregateHistoryByMember([
      {
        payment: makePayment('pay-1', 15_000, ['acc-1'], '2026-07-10'),
        accruals: [a1],
      },
      {
        payment: makePayment('pay-2', 20_000, ['acc-2'], '2026-07-15'),
        accruals: [a2],
      },
    ]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.professionalId).toBe(MEMBER);
    expect(summaries[0]?.paidValueCents).toBe(35_000);
    expect(summaries[0]?.totalCents).toBe(35_000);
    expect(summaries[0]?.discountCents).toBe(0);
    expect(summaries[0]?.ruleGroups).toHaveLength(1);
    expect(summaries[0]?.ruleGroups[0]?.rows).toHaveLength(2);
    expect(summaries[0]?.ruleGroups[0]?.totalCommissionCents).toBe(35_000);
    expect(summaries[0]?.paidAt).toBe('2026-07-15');
  });

  it('soma descontos dos pagamentos do profissional', () => {
    const summaries = aggregateHistoryByMember([
      {
        payment: CommissionPayment.create(
          {
            storeId: STORE,
            memberId: MEMBER,
            memberName: 'Danillo Mota',
            description: 'Comissão Danillo',
            paymentDate: parseIsoDateOnly('2026-07-10'),
            accountId: 'acc-1',
            paymentMethod: 'pix',
            grossCents: 20_000,
            discountCents: 5_000,
            netCents: 15_000,
            accrualIds: ['acc-1'],
          },
          'pay-disc',
        ),
        accruals: [makeAccrual('acc-1', 20_000)],
      },
    ]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.totalCents).toBe(20_000);
    expect(summaries[0]?.discountCents).toBe(5_000);
    expect(summaries[0]?.paidValueCents).toBe(15_000);
  });

  it('mantém profissionais distintos separados', () => {
    const other = CommissionAccrual.create(
      {
        storeId: STORE,
        memberId: 'member-other',
        memberName: 'Ana',
        paymentTrigger: 'debit_received',
        triggerLabel: 'Débito recebido do paciente',
        planName: 'Particular',
        specialtyName: 'Cirurgia',
        treatmentName: 'Consulta',
        patientName: 'Paciente',
        paidValueCents: 50_000,
        treatmentCostCents: 0,
        commissionCents: 5_000,
        accruedAt: parseIsoDateOnly('2026-07-12'),
        status: 'paid',
      },
      'acc-other',
    );

    const summaries = aggregateHistoryByMember([
      {
        payment: makePayment('pay-1', 15_000, ['acc-1'], '2026-07-10'),
        accruals: [makeAccrual('acc-1', 15_000)],
      },
      {
        payment: CommissionPayment.create(
          {
            storeId: STORE,
            memberId: 'member-other',
            memberName: 'Ana',
            description: 'Comissão Ana',
            paymentDate: parseIsoDateOnly('2026-07-12'),
            accountId: 'acc-1',
            paymentMethod: 'pix',
            grossCents: 5_000,
            netCents: 5_000,
            accrualIds: ['acc-other'],
          },
          'pay-other',
        ),
        accruals: [other],
      },
    ]);

    expect(summaries).toHaveLength(2);
    expect(
      summaries.find((s) => s.professionalId === MEMBER)?.paidValueCents,
    ).toBe(15_000);
    expect(
      summaries.find((s) => s.professionalId === 'member-other')?.paidValueCents,
    ).toBe(5_000);
  });
});
