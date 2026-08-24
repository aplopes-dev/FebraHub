import { BadRequestException } from '@nestjs/common';
import { CommissionAccrual } from '../../../../commissions/accruals/domain/entities/commission-accrual.entity';
import { CommissionPayment } from '../../../../commissions/payments/domain/entities/commission-payment.entity';
import { InMemoryCommissionPaymentRepository } from '../../../../commissions/payments/tests/in-memory-commission-payment.repository';
import type { CommissionType } from '../../../../commissions/shared/domain/commission-enums';
import { GetDashboardCommissionsUseCase } from './get-dashboard-commissions.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const otherStoreId = '22222222-2222-2222-2222-222222222222';
const IDS = {
  p1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  p2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  p3: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  a1: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  a2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  a3: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  a4: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
  m1: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  m2: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
} as const;

describe('GetDashboardCommissionsUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryCommissionPaymentRepository();
    return {
      repo,
      useCase: new GetDashboardCommissionsUseCase(repo),
    };
  }

  function accrual(input: {
    id: string;
    storeId?: string;
    memberId: string;
    memberName: string;
    paymentTrigger:
      | 'treatment_completed'
      | 'debit_received'
      | 'budget_approved';
    commissionCents: number;
    paidValueCents?: number;
    planName?: string;
    specialtyName?: string;
    treatmentName?: string;
    patientName?: string;
  }): CommissionAccrual {
    return CommissionAccrual.create(
      {
        storeId: input.storeId ?? storeId,
        memberId: input.memberId,
        memberName: input.memberName,
        paymentTrigger: input.paymentTrigger,
        triggerLabel: input.paymentTrigger,
        planName: input.planName ?? 'Plano A',
        specialtyName: input.specialtyName ?? 'Estética',
        treatmentName: input.treatmentName ?? 'Botox',
        patientName: input.patientName ?? 'Paciente',
        paidValueCents: input.paidValueCents ?? 10000,
        treatmentCostCents: 2000,
        commissionCents: input.commissionCents,
        accruedAt: new Date('2026-07-01T00:00:00.000Z'),
        status: 'paid',
      },
      input.id,
    );
  }

  function payment(input: {
    id: string;
    storeId?: string;
    memberId: string;
    memberName: string;
    paymentDate: Date;
    discountCents?: number;
    accrualIds: string[];
    grossCents: number;
  }): CommissionPayment {
    const discountCents = input.discountCents ?? 0;
    return CommissionPayment.create(
      {
        storeId: input.storeId ?? storeId,
        memberId: input.memberId,
        memberName: input.memberName,
        description: 'Pagamento teste',
        paymentDate: input.paymentDate,
        accountId: 'acct-1',
        paymentMethod: 'pix',
        grossCents: input.grossCents,
        discountCents,
        netCents: Math.max(0, input.grossCents - discountCents),
        accrualIds: input.accrualIds,
      },
      input.id,
    );
  }

  function seed(
    repo: InMemoryCommissionPaymentRepository,
    payments: Array<{
      payment: CommissionPayment;
      accrualIds: string[];
    }>,
    accruals: CommissionAccrual[],
    types: Record<string, CommissionType> = {},
  ) {
    repo.bindAccruals({
      getAll: () => accruals,
      markPaid: () => Promise.resolve(),
    });
    repo.bindCommissionTypes(types);
    repo.seed(payments);
  }

  it('requires month when periodMode is monthly', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        periodMode: 'monthly',
        year: 2026,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates net total, breakdowns, ranking and allocates discount', async () => {
    const { repo, useCase } = createUseCase();
    const accruals = [
      accrual({
        id: IDS.a1,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 10000,
      }),
      accrual({
        id: IDS.a2,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'debit_received',
        commissionCents: 5000,
        treatmentName: 'Peeling',
      }),
      accrual({
        id: IDS.a3,
        memberId: IDS.m2,
        memberName: 'Bruno',
        paymentTrigger: 'budget_approved',
        commissionCents: 3000,
      }),
    ];

    seed(
      repo,
      [
        {
          payment: payment({
            id: IDS.p1,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2026-07-10T00:00:00.000Z'),
            discountCents: 1500,
            accrualIds: [IDS.a1, IDS.a2],
            grossCents: 15000,
          }),
          accrualIds: [IDS.a1, IDS.a2],
        },
        {
          payment: payment({
            id: IDS.p2,
            memberId: IDS.m2,
            memberName: 'Bruno',
            paymentDate: new Date('2026-07-15T00:00:00.000Z'),
            accrualIds: [IDS.a3],
            grossCents: 3000,
          }),
          accrualIds: [IDS.a3],
        },
      ],
      accruals,
      {
        [IDS.a1]: 'fixed_value',
        [IDS.a2]: 'percentage',
        [IDS.a3]: 'percentage',
      },
    );

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    // Ana: 15000-1500=13500; Bruno: 3000 → net 16500
    expect(result.netTotalCents).toBe(16500);
    expect(result.byTrigger).toEqual([
      {
        key: 'treatment_completed',
        label: 'Procedimento finalizado',
        grossCents: 10000,
        percent: 55.6,
      },
      {
        key: 'debit_received',
        label: 'Débito recebido do paciente',
        grossCents: 5000,
        percent: 27.8,
      },
      {
        key: 'budget_approved',
        label: 'Aprovação de orçamento',
        grossCents: 3000,
        percent: 16.7,
      },
    ]);
    expect(result.byType).toEqual([
      {
        key: 'fixed_value',
        label: 'Comissão por valor fixo (R$)',
        grossCents: 10000,
        percent: 55.6,
      },
      {
        key: 'percentage',
        label: 'Comissão por percentual (%)',
        grossCents: 8000,
        percent: 44.4,
      },
    ]);
    expect(result.ranking).toEqual([
      {
        professionalId: IDS.m1,
        professionalName: 'Ana',
        netCents: 13500,
        count: 2,
      },
      {
        professionalId: IDS.m2,
        professionalName: 'Bruno',
        netCents: 3000,
        count: 1,
      },
    ]);
  });

  it('filters annual period and isolates store', async () => {
    const { repo, useCase } = createUseCase();
    const accruals = [
      accrual({
        id: IDS.a1,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 1000,
      }),
      accrual({
        id: IDS.a2,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 2000,
      }),
      accrual({
        id: IDS.a3,
        storeId: otherStoreId,
        memberId: IDS.m2,
        memberName: 'Outro',
        paymentTrigger: 'treatment_completed',
        commissionCents: 9000,
      }),
    ];

    seed(
      repo,
      [
        {
          payment: payment({
            id: IDS.p1,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2026-03-15T00:00:00.000Z'),
            accrualIds: [IDS.a1],
            grossCents: 1000,
          }),
          accrualIds: [IDS.a1],
        },
        {
          payment: payment({
            id: IDS.p2,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2025-12-31T00:00:00.000Z'),
            accrualIds: [IDS.a2],
            grossCents: 2000,
          }),
          accrualIds: [IDS.a2],
        },
        {
          payment: payment({
            id: IDS.p3,
            storeId: otherStoreId,
            memberId: IDS.m2,
            memberName: 'Outro',
            paymentDate: new Date('2026-03-01T00:00:00.000Z'),
            accrualIds: [IDS.a3],
            grossCents: 9000,
          }),
          accrualIds: [IDS.a3],
        },
      ],
      accruals,
      {
        [IDS.a1]: 'percentage',
        [IDS.a2]: 'percentage',
        [IDS.a3]: 'percentage',
      },
    );

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.netTotalCents).toBe(1000);
  });

  it('returns distinct payment years descending', async () => {
    const { repo, useCase } = createUseCase();
    const accruals = [
      accrual({
        id: IDS.a1,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 100,
      }),
      accrual({
        id: IDS.a2,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 100,
      }),
      accrual({
        id: IDS.a3,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 100,
      }),
    ];

    seed(
      repo,
      [
        {
          payment: payment({
            id: IDS.p1,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2026-07-01T00:00:00.000Z'),
            accrualIds: [IDS.a1],
            grossCents: 100,
          }),
          accrualIds: [IDS.a1],
        },
        {
          payment: payment({
            id: IDS.p2,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2024-01-01T00:00:00.000Z'),
            accrualIds: [IDS.a2],
            grossCents: 100,
          }),
          accrualIds: [IDS.a2],
        },
        {
          payment: payment({
            id: IDS.p3,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2025-06-01T00:00:00.000Z'),
            accrualIds: [IDS.a3],
            grossCents: 100,
          }),
          accrualIds: [IDS.a3],
        },
      ],
      accruals,
    );

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.years).toEqual([2026, 2025, 2024]);
  });

  it('falls back commissionType to percentage when rule missing', async () => {
    const { repo, useCase } = createUseCase();
    const accruals = [
      accrual({
        id: IDS.a1,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 1000,
      }),
    ];

    seed(
      repo,
      [
        {
          payment: payment({
            id: IDS.p1,
            memberId: IDS.m1,
            memberName: 'Ana',
            paymentDate: new Date('2026-07-05T00:00:00.000Z'),
            accrualIds: [IDS.a1],
            grossCents: 1000,
          }),
          accrualIds: [IDS.a1],
        },
      ],
      accruals,
      {},
    );

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(result.byType[1]).toMatchObject({
      key: 'percentage',
      grossCents: 1000,
      percent: 100,
    });
  });
});
