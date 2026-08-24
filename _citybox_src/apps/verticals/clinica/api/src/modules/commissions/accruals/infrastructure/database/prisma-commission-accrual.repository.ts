import { Injectable } from '@nestjs/common';
import {
  CommissionAccrualStatus,
  CommissionPaymentTrigger,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionAccrual } from '../../domain/entities/commission-accrual.entity';
import {
  CommissionAccrualRepository,
  type CommissionAccrualFilterCriteria,
} from '../../domain/repositories/commission-accrual.repository.interface';
import {
  parseIsoDateOnly,
} from '../../../shared/domain/commission-date.utils';

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

@Injectable()
export class PrismaCommissionAccrualRepository extends CommissionAccrualRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(accrual: CommissionAccrual): Promise<CommissionAccrual> {
    const row = await this.prisma.commissionAccrual.upsert({
      where: { id: accrual.id },
      create: {
        id: accrual.id,
        storeId: accrual.storeId,
        memberId: accrual.memberId,
        memberName: accrual.memberName,
        ruleId: accrual.ruleId,
        paymentTrigger: accrual.paymentTrigger as CommissionPaymentTrigger,
        triggerLabel: accrual.triggerLabel,
        planName: accrual.planName,
        specialtyName: accrual.specialtyName,
        treatmentName: accrual.treatmentName,
        patientName: accrual.patientName,
        paidValueCents: accrual.paidValueCents,
        treatmentCostCents: accrual.treatmentCostCents,
        installment: accrual.installment,
        commissionCents: accrual.commissionCents,
        accruedAt: accrual.accruedAt,
        sourceFinancialEntryId: accrual.sourceFinancialEntryId,
        sourceBudgetId: accrual.sourceBudgetId,
        sourcePatientTreatmentId: accrual.sourcePatientTreatmentId,
        status: accrual.status as CommissionAccrualStatus,
        createdAt: accrual.createdAt,
        updatedAt: accrual.updatedAt,
      },
      update: {
        memberName: accrual.memberName,
        ruleId: accrual.ruleId,
        paymentTrigger: accrual.paymentTrigger as CommissionPaymentTrigger,
        triggerLabel: accrual.triggerLabel,
        planName: accrual.planName,
        specialtyName: accrual.specialtyName,
        treatmentName: accrual.treatmentName,
        patientName: accrual.patientName,
        paidValueCents: accrual.paidValueCents,
        treatmentCostCents: accrual.treatmentCostCents,
        installment: accrual.installment,
        commissionCents: accrual.commissionCents,
        accruedAt: accrual.accruedAt,
        sourceFinancialEntryId: accrual.sourceFinancialEntryId,
        sourceBudgetId: accrual.sourceBudgetId,
        sourcePatientTreatmentId: accrual.sourcePatientTreatmentId,
        status: accrual.status as CommissionAccrualStatus,
        updatedAt: accrual.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async findOpenByStore(
    storeId: string,
    criteria: CommissionAccrualFilterCriteria,
  ): Promise<CommissionAccrual[]> {
    const rows = await this.prisma.commissionAccrual.findMany({
      where: this.buildWhere(storeId, { ...criteria, status: 'open' }),
      orderBy: [{ memberName: 'asc' }, { accruedAt: 'asc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findOpenByMember(
    storeId: string,
    memberId: string,
    criteria?: CommissionAccrualFilterCriteria,
  ): Promise<CommissionAccrual[]> {
    const rows = await this.prisma.commissionAccrual.findMany({
      where: this.buildWhere(storeId, {
        ...criteria,
        memberId,
        status: 'open',
      }),
      orderBy: { accruedAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findManyByIds(
    storeId: string,
    memberId: string,
    ids: string[],
  ): Promise<CommissionAccrual[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.commissionAccrual.findMany({
      where: { storeId, memberId, id: { in: ids } },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findBySourceFinancialEntryId(
    storeId: string,
    sourceFinancialEntryId: string,
  ): Promise<CommissionAccrual[]> {
    const rows = await this.prisma.commissionAccrual.findMany({
      where: { storeId, sourceFinancialEntryId },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findBySourceBudgetId(
    storeId: string,
    sourceBudgetId: string,
  ): Promise<CommissionAccrual[]> {
    const rows = await this.prisma.commissionAccrual.findMany({
      where: { storeId, sourceBudgetId },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findBySourcePatientTreatmentId(
    storeId: string,
    sourcePatientTreatmentId: string,
  ): Promise<CommissionAccrual[]> {
    const rows = await this.prisma.commissionAccrual.findMany({
      where: { storeId, sourcePatientTreatmentId },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async markPaid(storeId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.commissionAccrual.updateMany({
      where: { storeId, id: { in: ids } },
      data: { status: 'paid', updatedAt: new Date() },
    });
  }

  private buildWhere(
    storeId: string,
    criteria: CommissionAccrualFilterCriteria & {
      status?: 'open' | 'paid';
    },
  ) {
    const accruedAtFilter: { gte?: Date; lte?: Date } = {};
    if (criteria.startDate) {
      accruedAtFilter.gte = parseIsoDateOnly(criteria.startDate);
    }
    if (criteria.endDate) {
      accruedAtFilter.lte = parseIsoDateOnly(criteria.endDate);
    }

    return {
      storeId,
      ...(criteria.status ? { status: criteria.status } : {}),
      ...(criteria.memberId ? { memberId: criteria.memberId } : {}),
      ...(Object.keys(accruedAtFilter).length > 0
        ? { accruedAt: accruedAtFilter }
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

  private toEntity(row: AccrualRow): CommissionAccrual {
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
}
