import { Injectable } from '@nestjs/common';
import {
  BudgetDiscountType,
  BudgetItemLocationType,
  BudgetStatus,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { BudgetRepository } from '../../domain/repositories/budget.repository.interface';
import type {
  ApprovedBudgetInRangeCriteria,
  ApprovedBudgetWithItems,
  BudgetAnalysisInRangeCriteria,
  BudgetAnalysisMeta,
  BudgetDetail,
  BudgetListCriteria,
  BudgetListItem,
  BudgetStatusUpdateMeta,
  OpenRejectedBudgetListCriteria,
  OpenRejectedBudgetListResult,
} from '../../domain/repositories/budget.repository.interface';
import {
  buildBudgetListOrderBy,
  buildBudgetListWhere,
} from './budget-list.where';
import {
  Budget,
  type BudgetProps,
  type BudgetStatus as DomainBudgetStatus,
} from '../../domain/entities/budget.entity';
import {
  BudgetItem,
  type BudgetItemProps,
  type BudgetItemLocationType as DomainBudgetItemLocationType,
} from '../../domain/entities/budget-item.entity';

type BudgetRow = {
  id: string;
  storeId: string;
  patientId: string;
  description: string;
  date: Date;
  observations: string;
  responsibleId: string;
  responsibleName: string;
  discountType: BudgetDiscountType | null;
  discountValue: number | null;
  subtotalCents: number;
  finalValueCents: number;
  installmentEnabled: boolean;
  downPaymentCents: number;
  installmentsCount: number;
  status: BudgetStatus;
  supersedesBudgetId: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: BudgetItemRow[];
};

type BudgetItemRow = {
  id: string;
  storeId: string;
  budgetId: string;
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName: string;
  planName: string;
  treatmentName: string;
  valueCents: number;
  locationType: BudgetItemLocationType;
  locationLabel: string;
  sessionIndex: number | null;
  sessionTotal: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaBudgetRepository extends BudgetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<BudgetDetail | null> {
    const row = await this.prisma.budget.findFirst({
      where: { id: budgetId, storeId, patientId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return row ? this.toDetail(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: BudgetListCriteria,
  ): Promise<BudgetListItem[]> {
    const where = buildBudgetListWhere(storeId, patientId, criteria);
    const rows = await this.prisma.budget.findMany({
      where,
      orderBy: buildBudgetListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
      include: {
        _count: { select: { items: true } },
        contractEmissions: {
          select: {
            id: true,
            patientSignatureStatus: true,
            responsibleSignatureStatus: true,
            patientName: true,
            responsibleName: true,
          },
          take: 1,
        },
      },
    });

    const emissionIds = rows
      .map((row) => row.contractEmissions[0]?.id)
      .filter((id): id is string => Boolean(id));

    const signedAtByEmission = await this.loadContractSignerSignedAts(
      storeId,
      emissionIds,
    );

    return rows.map((row) => {
      const emission = row.contractEmissions[0] ?? null;
      const signedAts = emission
        ? signedAtByEmission.get(emission.id)
        : undefined;
      return {
        budget: this.toBudgetEntity(row),
        itemsCount: row._count.items,
        contractEmissionId: emission?.id ?? null,
        contractPatientSignatureStatus: emission?.patientSignatureStatus ?? null,
        contractResponsibleSignatureStatus:
          emission?.responsibleSignatureStatus ?? null,
        contractPatientName: emission?.patientName ?? null,
        contractResponsibleName: emission?.responsibleName ?? null,
        contractPatientSignedAt: signedAts?.patientSignedAt ?? null,
        contractResponsibleSignedAt: signedAts?.responsibleSignedAt ?? null,
      };
    });
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<BudgetListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.budget.count({
      where: buildBudgetListWhere(storeId, patientId, criteria),
    });
  }

  async save(detail: BudgetDetail): Promise<BudgetDetail> {
    await this.prisma.$transaction(async (tx) => {
      await tx.budget.upsert({
        where: { id: detail.budget.id },
        create: {
          id: detail.budget.id,
          storeId: detail.budget.storeId,
          patientId: detail.budget.patientId,
          description: detail.budget.description,
          date: detail.budget.date,
          observations: detail.budget.observations,
          responsibleId: detail.budget.responsibleId,
          responsibleName: detail.budget.responsibleName,
          discountType: detail.budget.discountType,
          discountValue: detail.budget.discountValue,
          subtotalCents: detail.budget.subtotalCents,
          finalValueCents: detail.budget.finalValueCents,
          installmentEnabled: detail.budget.installmentEnabled,
          downPaymentCents: detail.budget.downPaymentCents,
          installmentsCount: detail.budget.installmentsCount,
          status: detail.budget.status,
          supersedesBudgetId: detail.budget.supersedesBudgetId,
          approvedAt: detail.budget.approvedAt,
          rejectedAt: detail.budget.rejectedAt,
          rejectionReason: detail.budget.rejectionReason,
          createdAt: detail.budget.createdAt,
          updatedAt: detail.budget.updatedAt,
        },
        update: {
          description: detail.budget.description,
          date: detail.budget.date,
          observations: detail.budget.observations,
          responsibleId: detail.budget.responsibleId,
          responsibleName: detail.budget.responsibleName,
          discountType: detail.budget.discountType,
          discountValue: detail.budget.discountValue,
          subtotalCents: detail.budget.subtotalCents,
          finalValueCents: detail.budget.finalValueCents,
          installmentEnabled: detail.budget.installmentEnabled,
          downPaymentCents: detail.budget.downPaymentCents,
          installmentsCount: detail.budget.installmentsCount,
          status: detail.budget.status,
          supersedesBudgetId: detail.budget.supersedesBudgetId,
          approvedAt: detail.budget.approvedAt,
          rejectedAt: detail.budget.rejectedAt,
          rejectionReason: detail.budget.rejectionReason,
          updatedAt: detail.budget.updatedAt,
        },
      });

      await tx.budgetItem.deleteMany({
        where: { budgetId: detail.budget.id, storeId: detail.budget.storeId },
      });

      if (detail.items.length > 0) {
        await tx.budgetItem.createMany({
          data: detail.items.map((item) => ({
            id: item.id,
            storeId: item.storeId,
            budgetId: item.budgetId,
            planId: item.planId,
            treatmentId: item.treatmentId,
            professionalId: item.professionalId,
            professionalName: item.professionalName,
            planName: item.planName,
            treatmentName: item.treatmentName,
            valueCents: item.valueCents,
            locationType: item.locationType,
            locationLabel: item.locationLabel,
            sessionIndex: item.sessionIndex,
            sessionTotal: item.sessionTotal,
            sortOrder: item.sortOrder,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
        });
      }
    });

    const saved = await this.findById(
      detail.budget.storeId,
      detail.budget.patientId,
      detail.budget.id,
    );
    if (!saved) {
      throw new Error('Failed to reload budget after save');
    }
    return saved;
  }

  async delete(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<void> {
    await this.prisma.budget.deleteMany({
      where: { id: budgetId, storeId, patientId },
    });
  }

  async updateStatus(
    storeId: string,
    patientId: string,
    budgetId: string,
    status: DomainBudgetStatus,
    meta?: BudgetStatusUpdateMeta,
  ): Promise<BudgetDetail | null> {
    const data: {
      status: DomainBudgetStatus;
      updatedAt: Date;
      approvedAt?: Date;
      rejectedAt?: Date | null;
      rejectionReason?: string | null;
    } = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'approved') {
      data.approvedAt = new Date();
      data.rejectedAt = null;
      data.rejectionReason = null;
    } else if (status === 'rejected') {
      data.rejectedAt = meta?.rejectedAt ?? new Date();
      data.rejectionReason = meta?.rejectionReason ?? null;
    } else if (status === 'pending') {
      data.rejectedAt = null;
      data.rejectionReason = null;
    }

    const result = await this.prisma.budget.updateMany({
      where: { id: budgetId, storeId, patientId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(storeId, patientId, budgetId);
  }

  async sumOpenRejectedBudgetsCents(storeId: string): Promise<number> {
    const result = await this.prisma.budget.aggregate({
      where: {
        storeId,
        status: { in: ['pending', 'rejected'] },
      },
      _sum: { finalValueCents: true },
    });
    return result._sum.finalValueCents ?? 0;
  }

  async listOpenRejectedBudgets(
    storeId: string,
    criteria: OpenRejectedBudgetListCriteria,
  ): Promise<OpenRejectedBudgetListResult> {
    const where = {
      storeId,
      status: { in: ['pending', 'rejected'] as BudgetStatus[] },
    };

    const [rows, total, aggregate] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          date: true,
          patientId: true,
          description: true,
          status: true,
          finalValueCents: true,
          patient: { select: { name: true } },
        },
      }),
      this.prisma.budget.count({ where }),
      this.prisma.budget.aggregate({
        where,
        _sum: { finalValueCents: true },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        date: row.date,
        patientId: row.patientId,
        patientName: row.patient.name,
        description: row.description,
        status: row.status as 'pending' | 'rejected',
        finalValueCents: row.finalValueCents,
      })),
      total,
      totalValueCents: aggregate._sum.finalValueCents ?? 0,
    };
  }

  async listApprovedBudgetsInRange(
    storeId: string,
    criteria: ApprovedBudgetInRangeCriteria,
  ): Promise<ApprovedBudgetWithItems[]> {
    const start = new Date(`${criteria.startIsoDate}T00:00:00.000Z`);
    const end = new Date(`${criteria.endIsoDate}T23:59:59.999Z`);
    const dateStart = new Date(`${criteria.startIsoDate}T00:00:00.000Z`);
    const dateEnd = new Date(`${criteria.endIsoDate}T00:00:00.000Z`);

    const rows = await this.prisma.budget.findMany({
      where: {
        storeId,
        status: 'approved',
        OR: [
          { approvedAt: { gte: start, lte: end } },
          {
            AND: [
              { approvedAt: null },
              { date: { gte: dateStart, lte: dateEnd } },
            ],
          },
        ],
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        patient: { select: { name: true } },
      },
      orderBy: [{ approvedAt: 'desc' }, { date: 'desc' }],
    });

    return rows.map((row) => ({
      budget: this.toBudgetEntity(row),
      items: row.items.map((item) => this.toItemEntity(item)),
      patientName: row.patient.name,
    }));
  }

  async findManyDetailsByIds(
    storeId: string,
    budgetIds: string[],
  ): Promise<ApprovedBudgetWithItems[]> {
    if (budgetIds.length === 0) return [];

    const rows = await this.prisma.budget.findMany({
      where: { storeId, id: { in: budgetIds } },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        patient: { select: { name: true } },
      },
    });

    return rows.map((row) => ({
      budget: this.toBudgetEntity(row),
      items: row.items.map((item) => this.toItemEntity(item)),
      patientName: row.patient.name,
    }));
  }

  async listBudgetsForAnalysisInRange(
    storeId: string,
    criteria: BudgetAnalysisInRangeCriteria,
  ): Promise<ApprovedBudgetWithItems[]> {
    const dateStart = new Date(`${criteria.startIsoDate}T00:00:00.000Z`);
    const dateEnd = new Date(`${criteria.endIsoDate}T00:00:00.000Z`);
    const statuses = criteria.statuses ?? [
      'pending',
      'approved',
      'rejected',
    ];

    const rows = await this.prisma.budget.findMany({
      where: {
        storeId,
        status: { in: statuses },
        date: { gte: dateStart, lte: dateEnd },
        ...(criteria.responsibleId
          ? { responsibleId: criteria.responsibleId }
          : {}),
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        patient: { select: { name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => ({
      budget: this.toBudgetEntity(row),
      items: row.items.map((item) => this.toItemEntity(item)),
      patientName: row.patient.name,
    }));
  }

  async listBudgetAnalysisMeta(storeId: string): Promise<BudgetAnalysisMeta> {
    const [professionals, yearRows] = await Promise.all([
      this.prisma.budget.findMany({
        where: {
          storeId,
          status: { in: ['pending', 'approved', 'rejected'] },
        },
        distinct: ['responsibleId'],
        select: { responsibleId: true, responsibleName: true },
        orderBy: { responsibleName: 'asc' },
      }),
      this.prisma.$queryRaw<Array<{ year: number }>>`
        SELECT DISTINCT EXTRACT(YEAR FROM date)::int AS year
        FROM clinica.budgets
        WHERE store_id = ${storeId}
          AND status IN ('pending', 'approved', 'rejected')
        ORDER BY year DESC
      `,
    ]);

    return {
      professionals: professionals.map((row) => ({
        id: row.responsibleId,
        name: row.responsibleName,
      })),
      years: yearRows.map((row) => row.year),
    };
  }

  private async loadContractSignerSignedAts(
    storeId: string,
    emissionIds: string[],
  ): Promise<
    Map<
      string,
      { patientSignedAt: string | null; responsibleSignedAt: string | null }
    >
  > {
    const result = new Map<
      string,
      { patientSignedAt: string | null; responsibleSignedAt: string | null }
    >();
    if (emissionIds.length === 0) return result;

    const signatures = await this.prisma.electronicSignature.findMany({
      where: {
        storeId,
        kind: 'contract',
        targetId: { in: emissionIds },
        status: { in: ['pending', 'signed'] },
      },
      orderBy: { requestedAt: 'desc' },
      select: {
        targetId: true,
        signers: true,
        completedAt: true,
      },
    });

    for (const signature of signatures) {
      const targetId = signature.targetId;
      if (!targetId || result.has(targetId)) continue;

      const signers = Array.isArray(signature.signers)
        ? (signature.signers as Array<{
            role?: string;
            status?: string;
            signedAt?: string | null;
          }>)
        : [];

      const patient = signers.find((s) => s.role === 'patient');
      const responsible = signers.find((s) => s.role === 'responsible');
      const fallbackSignedAt = signature.completedAt?.toISOString() ?? null;

      result.set(targetId, {
        patientSignedAt:
          patient?.status === 'signed'
            ? (patient.signedAt?.trim() || fallbackSignedAt)
            : null,
        responsibleSignedAt:
          responsible?.status === 'signed'
            ? (responsible.signedAt?.trim() || fallbackSignedAt)
            : null,
      });
    }

    return result;
  }

  private toBudgetEntity(row: Omit<BudgetRow, 'items'>): Budget {
    const budgetProps: BudgetProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      description: row.description,
      date: row.date,
      observations: row.observations,
      responsibleId: row.responsibleId,
      responsibleName: row.responsibleName,
      discountType: row.discountType,
      discountValue: row.discountValue,
      subtotalCents: row.subtotalCents,
      finalValueCents: row.finalValueCents,
      installmentEnabled: row.installmentEnabled,
      downPaymentCents: row.downPaymentCents,
      installmentsCount: row.installmentsCount,
      status: row.status,
      supersedesBudgetId: row.supersedesBudgetId,
      approvedAt: row.approvedAt,
      rejectedAt: row.rejectedAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return Budget.with(budgetProps, row.id);
  }

  private toDetail(row: BudgetRow): BudgetDetail {
    const budget = this.toBudgetEntity(row);
    const items = row.items.map((item) => this.toItemEntity(item));
    return { budget, items };
  }

  private toItemEntity(row: BudgetItemRow): BudgetItem {
    const props: BudgetItemProps = {
      storeId: row.storeId,
      budgetId: row.budgetId,
      planId: row.planId,
      treatmentId: row.treatmentId,
      professionalId: row.professionalId,
      professionalName: row.professionalName,
      planName: row.planName,
      treatmentName: row.treatmentName,
      valueCents: row.valueCents,
      locationType: row.locationType,
      locationLabel: row.locationLabel,
      sessionIndex: row.sessionIndex,
      sessionTotal: row.sessionTotal,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return BudgetItem.with(props, row.id);
  }
}
