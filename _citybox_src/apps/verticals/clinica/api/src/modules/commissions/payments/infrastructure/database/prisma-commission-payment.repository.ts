import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionPayment } from '../../domain/entities/commission-payment.entity';
import {
  CommissionPaymentRepository,
  type CommissionPaymentFilterCriteria,
  type CommissionPaymentLoaded,
  type DashboardCommissionPaymentBundle,
} from '../../domain/repositories/commission-payment.repository.interface';
import { CommissionAccrual } from '../../../accruals/domain/entities/commission-accrual.entity';
import {
  parseIsoDateOnly,
  toIsoDateOnly,
} from '../../../shared/domain/commission-date.utils';
import type {
  CommissionAccrualStatus,
  CommissionPaymentTrigger,
  CommissionType,
} from '../../../../../../generated/prisma/client';

type AccrualRow = {
  id: string;
  storeId: string;
  memberId: string;
  memberName: string;
  ruleId: string | null;
  paymentTrigger: CommissionPaymentTrigger;
  triggerLabel: string;
  planName: string;
  specialtyName: string;
  treatmentName: string;
  patientName: string;
  paidValueCents: number;
  treatmentCostCents: number;
  installment: string | null;
  commissionCents: number;
  accruedAt: Date;
  sourceFinancialEntryId: string | null;
  sourceBudgetId: string | null;
  sourcePatientTreatmentId: string | null;
  status: CommissionAccrualStatus;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentRow = {
  id: string;
  storeId: string;
  memberId: string;
  memberName: string;
  description: string;
  paymentDate: Date;
  accountId: string;
  paymentMethod: string;
  grossCents: number;
  discountCents: number;
  netCents: number;
  observation: string | null;
  expenseEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: { accrualId: string; accrual: AccrualRow }[];
};

@Injectable()
export class PrismaCommissionPaymentRepository extends CommissionPaymentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async saveWithItems(
    payment: CommissionPayment,
    accrualIds: string[],
  ): Promise<CommissionPayment> {
    await this.prisma.$transaction(async (tx) => {
      await tx.commissionPayment.create({
        data: {
          id: payment.id,
          storeId: payment.storeId,
          memberId: payment.memberId,
          memberName: payment.memberName,
          description: payment.description,
          paymentDate: payment.paymentDate,
          accountId: payment.accountId,
          paymentMethod: payment.paymentMethod,
          grossCents: payment.grossCents,
          discountCents: payment.discountCents,
          netCents: payment.netCents,
          observation: payment.observation,
          expenseEntryId: payment.expenseEntryId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          items: {
            create: accrualIds.map((accrualId) => ({
              id: randomUUID(),
              accrualId,
            })),
          },
        },
      });

      await tx.commissionAccrual.updateMany({
        where: {
          storeId: payment.storeId,
          id: { in: accrualIds },
        },
        data: { status: 'paid', updatedAt: new Date() },
      });
    });

    const loaded = await this.findById(payment.storeId, payment.id);
    return loaded!.payment;
  }

  async findMany(
    storeId: string,
    criteria: CommissionPaymentFilterCriteria,
  ): Promise<CommissionPaymentLoaded[]> {
    const rows = await this.prisma.commissionPayment.findMany({
      where: this.buildWhere(storeId, criteria),
      include: {
        items: { include: { accrual: true } },
      },
      orderBy: { paymentDate: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toLoaded(row as PaymentRow));
  }

  async count(
    storeId: string,
    criteria: Omit<CommissionPaymentFilterCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.commissionPayment.count({
      where: this.buildWhere(storeId, criteria),
    });
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<CommissionPaymentLoaded | null> {
    const row = await this.prisma.commissionPayment.findFirst({
      where: { storeId, id },
      include: {
        items: { include: { accrual: true } },
      },
    });
    if (!row) return null;
    return this.toLoaded(row);
  }

  async listPaymentsForDashboardInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<DashboardCommissionPaymentBundle[]> {
    const rows = await this.prisma.commissionPayment.findMany({
      where: {
        storeId,
        paymentDate: {
          gte: range.startAt,
          lte: range.endAt,
        },
      },
      include: {
        items: {
          include: {
            accrual: {
              include: { rule: { select: { commissionType: true } } },
            },
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });

    return rows.map((row) => this.toDashboardBundle(row));
  }

  async listCommissionPaymentYears(storeId: string): Promise<number[]> {
    const rows = await this.prisma.commissionPayment.findMany({
      where: { storeId },
      select: { paymentDate: true },
    });
    const years = new Set<number>();
    for (const row of rows) {
      years.add(Number(toIsoDateOnly(row.paymentDate).slice(0, 4)));
    }
    return [...years].filter(Number.isFinite).sort((a, b) => b - a);
  }

  private buildWhere(
    storeId: string,
    criteria:
      | Omit<CommissionPaymentFilterCriteria, 'skip' | 'take'>
      | CommissionPaymentFilterCriteria,
  ) {
    const paymentDateFilter: { gte?: Date; lte?: Date } = {};
    if (criteria.startDate) {
      paymentDateFilter.gte = parseIsoDateOnly(criteria.startDate);
    }
    if (criteria.endDate) {
      paymentDateFilter.lte = parseIsoDateOnly(criteria.endDate);
    }

    return {
      storeId,
      ...(criteria.memberId ? { memberId: criteria.memberId } : {}),
      ...(Object.keys(paymentDateFilter).length > 0
        ? { paymentDate: paymentDateFilter }
        : {}),
      ...(criteria.search?.trim()
        ? {
            memberName: {
              contains: criteria.search.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };
  }

  private toLoaded(row: PaymentRow): CommissionPaymentLoaded {
    const accrualIds = row.items.map((item) => item.accrualId);
    return {
      payment: CommissionPayment.with(
        {
          storeId: row.storeId,
          memberId: row.memberId,
          memberName: row.memberName,
          description: row.description,
          paymentDate: row.paymentDate,
          accountId: row.accountId,
          paymentMethod: row.paymentMethod,
          grossCents: row.grossCents,
          discountCents: row.discountCents,
          netCents: row.netCents,
          observation: row.observation,
          expenseEntryId: row.expenseEntryId,
          accrualIds,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        row.id,
      ),
      accruals: row.items.map((item) => this.toAccrual(item.accrual)),
    };
  }

  private toAccrual(row: AccrualRow): CommissionAccrual {
    return CommissionAccrual.with(
      {
        storeId: row.storeId,
        memberId: row.memberId,
        memberName: row.memberName,
        ruleId: row.ruleId,
        paymentTrigger: row.paymentTrigger,
        triggerLabel: row.triggerLabel,
        planName: row.planName,
        specialtyName: row.specialtyName,
        treatmentName: row.treatmentName,
        patientName: row.patientName,
        paidValueCents: row.paidValueCents,
        treatmentCostCents: row.treatmentCostCents,
        installment: row.installment,
        commissionCents: row.commissionCents,
        accruedAt: row.accruedAt,
        sourceFinancialEntryId: row.sourceFinancialEntryId,
        sourceBudgetId: row.sourceBudgetId,
        sourcePatientTreatmentId: row.sourcePatientTreatmentId,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toDashboardBundle(row: {
    id: string;
    memberId: string;
    memberName: string;
    paymentDate: Date;
    discountCents: number;
    items: Array<{
      accrual: AccrualRow & {
        rule: { commissionType: CommissionType } | null;
      };
    }>;
  }): DashboardCommissionPaymentBundle {
    return {
      paymentId: row.id,
      memberId: row.memberId,
      memberName: row.memberName,
      paymentDate: row.paymentDate,
      discountCents: row.discountCents,
      items: row.items.map(({ accrual }) => ({
        accrualId: accrual.id,
        paymentTrigger: accrual.paymentTrigger,
        commissionType: accrual.rule?.commissionType ?? 'percentage',
        planName: accrual.planName,
        specialtyName: accrual.specialtyName,
        treatmentName: accrual.treatmentName,
        patientName: accrual.patientName,
        paidValueCents: accrual.paidValueCents,
        treatmentCostCents: accrual.treatmentCostCents,
        installment: accrual.installment,
        commissionCents: accrual.commissionCents,
      })),
    };
  }
}
