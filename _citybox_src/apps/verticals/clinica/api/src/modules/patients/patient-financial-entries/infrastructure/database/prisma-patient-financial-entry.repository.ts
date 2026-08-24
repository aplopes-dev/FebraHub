import { Injectable } from '@nestjs/common';
import {
  FinancialEntrySource,
  FinancialEntryStatus,
  Prisma,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PatientFinancialEntry,
  type PatientFinancialDebitDetail,
  type PatientFinancialEntrySource,
  type PatientFinancialEntryStatus,
  type PatientFinancialReceiveDetail,
} from '../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../domain/repositories/patient-financial-entry.repository.interface';
import type {
  PatientFinancialEntryListCriteria,
  PatientFinancialEntryTotals,
  PatientFinancialEntryTotalsCriteria,
} from '../../domain/repositories/patient-financial-entry.repository.interface';
import {
  buildPatientFinancialEntryListOrderBy,
  buildPatientFinancialEntryListWhere,
  buildPatientFinancialEntryTotalsWhere,
} from './patient-financial-entry-list.where';

type FinancialEntryRow = {
  id: string;
  storeId: string;
  patientId: string | null;
  description: string;
  valueCents: number;
  status: FinancialEntryStatus;
  source: FinancialEntrySource;
  dueDate: Date;
  budgetId: string | null;
  budgetItemId: string | null;
  installmentIndex: number | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  paidAt: Date | null;
  paidValueCents: number | null;
  paymentMethod: string | null;
  paymentType: string | null;
  accountId: string | null;
  receiptObjectKey: string | null;
  debitDetail: unknown;
  receiveDetail: unknown;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientFinancialEntryRepository extends PatientFinancialEntryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    patientId: string,
    entryId: string,
  ): Promise<PatientFinancialEntry | null> {
    const row = await this.prisma.financialEntry.findFirst({
      where: {
        id: entryId,
        storeId,
        patientId,
        type: 'income',
        status: { in: ['pending', 'received'] },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientFinancialEntryListCriteria,
  ): Promise<PatientFinancialEntry[]> {
    const rows = await this.prisma.financialEntry.findMany({
      where: buildPatientFinancialEntryListWhere(storeId, patientId, criteria),
      orderBy: buildPatientFinancialEntryListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientFinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.financialEntry.count({
      where: buildPatientFinancialEntryListWhere(storeId, patientId, criteria),
    });
  }

  async sumTotalsByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientFinancialEntryTotalsCriteria,
  ): Promise<PatientFinancialEntryTotals> {
    const where = buildPatientFinancialEntryTotalsWhere(
      storeId,
      patientId,
      criteria,
    );

    const [receivedAgg, pendingAgg] = await Promise.all([
      this.prisma.financialEntry.aggregate({
        where: { ...where, status: 'received' },
        _sum: { valueCents: true },
      }),
      this.prisma.financialEntry.aggregate({
        where: { ...where, status: 'pending' },
        _sum: { valueCents: true },
      }),
    ]);

    return {
      receivedCents: receivedAgg._sum.valueCents ?? 0,
      pendingCents: pendingAgg._sum.valueCents ?? 0,
    };
  }

  async existsByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<boolean> {
    const count = await this.prisma.financialEntry.count({
      where: { storeId, budgetId },
    });
    return count > 0;
  }

  async save(entry: PatientFinancialEntry): Promise<PatientFinancialEntry> {
    const data = this.toPersistence(entry);
    const row = await this.prisma.financialEntry.upsert({
      where: { id: entry.id },
      create: data,
      update: data,
    });
    return this.toEntity(row);
  }

  async saveMany(
    entries: PatientFinancialEntry[],
  ): Promise<PatientFinancialEntry[]> {
    if (entries.length === 0) {
      return [];
    }

    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.financialEntry.create({
          data: this.toPersistence(entry),
        }),
      ),
    );

    return entries;
  }

  async delete(
    storeId: string,
    patientId: string,
    entryId: string,
  ): Promise<void> {
    await this.prisma.financialEntry.deleteMany({
      where: { id: entryId, storeId, patientId, type: 'income' },
    });
  }

  private toEntity(row: FinancialEntryRow): PatientFinancialEntry {
    if (!row.patientId) {
      throw new Error('Patient financial entry row missing patientId');
    }

    const status: PatientFinancialEntryStatus =
      row.status === 'received' ? 'received' : 'pending';
    const source: PatientFinancialEntrySource =
      row.source === 'avulso_debit' ? 'avulso_debit' : 'budget_approve';

    const receiveDetail =
      (row.receiveDetail as PatientFinancialReceiveDetail | null) ?? null;

    return PatientFinancialEntry.create(
      {
        storeId: row.storeId,
        patientId: row.patientId,
        date: row.dueDate,
        name: row.description,
        valueCents: row.valueCents,
        status,
        source,
        budgetId: row.budgetId,
        budgetItemId: row.budgetItemId,
        installmentIndex: row.installmentIndex,
        receivedAt: row.paidAt,
        debitDetail:
          (row.debitDetail as PatientFinancialDebitDetail | null) ?? null,
        receiveDetail: receiveDetail
          ? {
              ...receiveDetail,
              cashRegisterId:
                receiveDetail.cashRegisterId ?? row.accountId ?? '',
            }
          : null,
        receiptObjectKey: row.receiptObjectKey,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toPersistence(
    entry: PatientFinancialEntry,
  ): Prisma.FinancialEntryUncheckedCreateInput {
    const accountId = entry.receiveDetail?.cashRegisterId ?? null;

    return {
      id: entry.id,
      storeId: entry.storeId,
      type: 'income',
      status: entry.status,
      source: entry.source,
      description: entry.name,
      valueCents: entry.valueCents,
      dueDate: entry.date,
      paidAt: entry.receivedAt,
      paidValueCents: entry.receiveDetail?.paidValueCents ?? null,
      paymentMethod: entry.receiveDetail?.paymentMethod ?? null,
      paymentType: entry.receiveDetail?.cardMode ?? null,
      observation: entry.receiveDetail?.observations ?? null,
      accountId,
      patientId: entry.patientId,
      budgetId: entry.budgetId,
      budgetItemId: entry.budgetItemId,
      installmentIndex: entry.installmentIndex,
      installmentNumber:
        entry.installmentIndex !== null && entry.installmentIndex > 0
          ? entry.installmentIndex
          : null,
      debitDetail:
        entry.debitDetail === null
          ? Prisma.DbNull
          : (entry.debitDetail as Prisma.InputJsonValue),
      receiveDetail:
        entry.receiveDetail === null
          ? Prisma.DbNull
          : (entry.receiveDetail as Prisma.InputJsonValue),
      receiptObjectKey: entry.receiptObjectKey,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
