import { BadRequestException } from '@nestjs/common';
import { CommissionAccrual } from '../../../../commissions/accruals/domain/entities/commission-accrual.entity';
import { CommissionPayment } from '../../../../commissions/payments/domain/entities/commission-payment.entity';
import { InMemoryCommissionPaymentRepository } from '../../../../commissions/payments/tests/in-memory-commission-payment.repository';
import type { CommissionType } from '../../../../commissions/shared/domain/commission-enums';
import { GetDashboardCommissionsDetailsUseCase } from './get-dashboard-commissions-details.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const IDS = {
  p1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  p2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  a1: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  a2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  a3: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  m1: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  m2: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
} as const;

describe('GetDashboardCommissionsDetailsUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryCommissionPaymentRepository();
    return {
      repo,
      useCase: new GetDashboardCommissionsDetailsUseCase(repo),
    };
  }

  function accrual(input: {
    id: string;
    memberId: string;
    memberName: string;
    paymentTrigger:
      | 'treatment_completed'
      | 'debit_received'
      | 'budget_approved';
    commissionCents: number;
    treatmentName?: string;
  }): CommissionAccrual {
    return CommissionAccrual.create(
      {
        storeId,
        memberId: input.memberId,
        memberName: input.memberName,
        paymentTrigger: input.paymentTrigger,
        triggerLabel: input.paymentTrigger,
        planName: 'Plano A',
        specialtyName: 'Estética',
        treatmentName: input.treatmentName ?? 'Botox',
        patientName: 'Paciente',
        paidValueCents: 10000,
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
        storeId,
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

  it('requires startDate and endDate', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        startDate: '',
        endDate: '2026-07-31',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inverted date range', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        startDate: '2026-07-31',
        endDate: '2026-07-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('paginates flat rows and returns totalNetCents', async () => {
    const { repo, useCase } = createUseCase();
    const accruals = [
      accrual({
        id: IDS.a1,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'treatment_completed',
        commissionCents: 1000,
        treatmentName: 'A',
      }),
      accrual({
        id: IDS.a2,
        memberId: IDS.m1,
        memberName: 'Ana',
        paymentTrigger: 'debit_received',
        commissionCents: 2000,
        treatmentName: 'B',
      }),
      accrual({
        id: IDS.a3,
        memberId: IDS.m2,
        memberName: 'Bruno',
        paymentTrigger: 'budget_approved',
        commissionCents: 3000,
        treatmentName: 'C',
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
            accrualIds: [IDS.a1, IDS.a2],
            grossCents: 3000,
          }),
          accrualIds: [IDS.a1, IDS.a2],
        },
        {
          payment: payment({
            id: IDS.p2,
            memberId: IDS.m2,
            memberName: 'Bruno',
            paymentDate: new Date('2026-07-12T00:00:00.000Z'),
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

    const page1 = await useCase.execute({
      storeId,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      page: 1,
      perPage: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);
    expect(page1.totalNetCents).toBe(6000);
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0]?.id).toBe(IDS.a1);
    expect(page1.items[1]?.id).toBe(IDS.a2);

    const page2 = await useCase.execute({
      storeId,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      page: 2,
      perPage: 2,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]?.id).toBe(IDS.a3);
  });

  it('filters by professionalId', async () => {
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
            accrualIds: [IDS.a1],
            grossCents: 1000,
          }),
          accrualIds: [IDS.a1],
        },
        {
          payment: payment({
            id: IDS.p2,
            memberId: IDS.m2,
            memberName: 'Bruno',
            paymentDate: new Date('2026-07-12T00:00:00.000Z'),
            accrualIds: [IDS.a3],
            grossCents: 3000,
          }),
          accrualIds: [IDS.a3],
        },
      ],
      accruals,
    );

    const result = await useCase.execute({
      storeId,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      professionalId: IDS.m2,
    });

    expect(result.total).toBe(1);
    expect(result.totalNetCents).toBe(3000);
    expect(result.items[0]?.professionalId).toBe(IDS.m2);
  });
});
