import { Injectable } from '@nestjs/common';
import {
  FinancialEntrySource,
  FinancialEntryStatus,
  FinancialEntryType,
  Prisma,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinancialEntry,
  type FinancialEntryReceiveDetail,
} from '../../domain/entities/financial-entry.entity';
import {
  FinancialEntryRepository,
  type CashflowDashboardListItem,
  type TicketMedioDayMetricRow,
  type InadimplenciaDashboardDebtRow,
  type ExpenseByCategoryAggRow,
  type FinancialEntryByPaymentMethodCriteria,
  type FinancialEntryByPaymentMethodRow,
  type FinancialEntryListCriteria,
  type FinancialEntryLoaded,
  type FinancialEntryStats,
  type FinancialEntryStatsCriteria,
} from '../../domain/repositories/financial-entry.repository.interface';
import {
  buildFinancialEntryListOrderBy,
  buildFinancialEntryListWhere,
  buildFinancialEntryStatsWhere,
} from './financial-entry-list.where';

type EntryInclude = {
  account: { id: string; name: string } | null;
  expenseCategory: { id: string; name: string; color: string } | null;
  incomeCategory: { id: string; name: string; color: string } | null;
  client: { id: string; name: string; phone: string } | null;
};

type EntryRow = {
  id: string;
  storeId: string;
  type: FinancialEntryType;
  status: FinancialEntryStatus;
  source: FinancialEntrySource;
  description: string;
  valueCents: number;
  dueDate: Date;
  paidAt: Date | null;
  paidValueCents: number | null;
  paymentMethod: string | null;
  paymentType: string | null;
  observation: string | null;
  accountId: string | null;
  expenseCategoryId: string | null;
  incomeCategoryId: string | null;
  clientId: string | null;
  appointmentId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  recurrenceGroupId: string | null;
  receiveDetail: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const entryInclude = {
  account: { select: { id: true, name: true } },
  expenseCategory: { select: { id: true, name: true, color: true } },
  incomeCategory: { select: { id: true, name: true, color: true } },
  client: { select: { id: true, name: true, phone: true } },
} as const;

@Injectable()
export class PrismaFinancialEntryRepository extends FinancialEntryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<FinancialEntryLoaded | null> {
    const row = await this.prisma.financialEntry.findFirst({
      where: { id, storeId },
      include: entryInclude,
    });
    return row ? this.toLoaded(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: FinancialEntryListCriteria,
  ): Promise<FinancialEntryLoaded[]> {
    const rows = await this.prisma.financialEntry.findMany({
      where: buildFinancialEntryListWhere(storeId, criteria),
      orderBy: buildFinancialEntryListOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
      include: entryInclude,
    });
    return rows.map((row) => this.toLoaded(row));
  }

  async count(
    storeId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.financialEntry.count({
      where: buildFinancialEntryListWhere(storeId, criteria),
    });
  }

  async computeStats(
    storeId: string,
    criteria: FinancialEntryStatsCriteria,
  ): Promise<FinancialEntryStats> {
    const where = buildFinancialEntryStatsWhere(storeId, criteria);
    const rows = await this.prisma.financialEntry.findMany({
      where,
      select: { type: true, status: true, valueCents: true },
    });

    let incomeReceived = 0;
    let incomeToReceive = 0;
    let expensePaid = 0;
    let expenseToPay = 0;

    for (const row of rows) {
      if (row.type === 'income') {
        if (row.status === 'received') incomeReceived += row.valueCents;
        else if (row.status === 'pending') incomeToReceive += row.valueCents;
      } else if (row.type === 'expense') {
        if (row.status === 'paid') expensePaid += row.valueCents;
        else if (row.status === 'pending') expenseToPay += row.valueCents;
      }
    }

    return {
      income: {
        received: incomeReceived,
        toReceive: incomeToReceive,
        total: incomeReceived + incomeToReceive,
      },
      expense: {
        paid: expensePaid,
        toPay: expenseToPay,
        total: expensePaid + expenseToPay,
      },
      balance: {
        current: incomeReceived - expensePaid,
        projected:
          incomeReceived + incomeToReceive - (expensePaid + expenseToPay),
      },
    };
  }

  async sumOverdueIncomeCents(
    storeId: string,
    todayIsoDate: string,
  ): Promise<number> {
    const result = await this.prisma.financialEntry.aggregate({
      where: {
        storeId,
        type: 'income',
        status: 'pending',
        dueDate: { lt: new Date(`${todayIsoDate}T00:00:00.000Z`) },
      },
      _sum: { valueCents: true },
    });
    return result._sum.valueCents ?? 0;
  }

  async aggregateByPaymentMethod(
    storeId: string,
    criteria: FinancialEntryByPaymentMethodCriteria,
  ): Promise<FinancialEntryByPaymentMethodRow[]> {
    const where = buildFinancialEntryListWhere(storeId, {
      ...criteria,
      statuses: ['paid', 'received'],
    });

    where.paymentMethod = criteria.paymentMethods?.length
      ? { in: criteria.paymentMethods }
      : { not: null };

    const groups = await this.prisma.financialEntry.groupBy({
      by: ['paymentMethod', 'type'],
      where,
      _sum: { valueCents: true },
    });

    const byMethod = new Map<
      string,
      { incomeCents: number; expenseCents: number }
    >();

    for (const group of groups) {
      const method = group.paymentMethod ?? 'unknown';
      let bucket = byMethod.get(method);
      if (!bucket) {
        bucket = { incomeCents: 0, expenseCents: 0 };
        byMethod.set(method, bucket);
      }
      const sum = group._sum.valueCents ?? 0;
      if (group.type === 'income') bucket.incomeCents += sum;
      else bucket.expenseCents += sum;
    }

    return [...byMethod.entries()]
      .map(([paymentMethod, bucket]) => ({
        paymentMethod,
        incomeCents: bucket.incomeCents,
        expenseCents: bucket.expenseCents,
        balanceCents: bucket.incomeCents - bucket.expenseCents,
      }))
      .sort((a, b) => a.paymentMethod.localeCompare(b.paymentMethod));
  }

  async save(entry: FinancialEntry): Promise<FinancialEntry> {
    const data = this.toPersistence(entry);
    await this.prisma.financialEntry.upsert({
      where: { id: entry.id },
      create: data,
      update: data,
    });
    return entry;
  }

  async saveMany(entries: FinancialEntry[]): Promise<FinancialEntry[]> {
    await Promise.all(
      entries.map((entry) => {
        const data = this.toPersistence(entry);
        return this.prisma.financialEntry.upsert({
          where: { id: entry.id },
          create: data,
          update: data,
        });
      }),
    );
    return entries;
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.financialEntry.deleteMany({ where: { id, storeId } });
  }

  async findByRecurrenceGroup(
    storeId: string,
    groupId: string,
  ): Promise<FinancialEntry[]> {
    const rows = await this.prisma.financialEntry.findMany({
      where: { storeId, recurrenceGroupId: groupId },
      orderBy: { dueDate: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async existsByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<boolean> {
    const count = await this.prisma.financialEntry.count({
      where: { storeId, appointmentId },
    });
    return count > 0;
  }

  async findByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<FinancialEntry | null> {
    const row = await this.prisma.financialEntry.findFirst({
      where: { storeId, appointmentId },
    });
    return row ? this.toEntity(row) : null;
  }

  async listReceivedIncomeInPaidAtRange(
    storeId: string,
    startIsoDate: string,
    endIsoDate: string,
  ): Promise<FinancialEntryLoaded[]> {
    const start = new Date(`${startIsoDate}T00:00:00.000Z`);
    const end = new Date(`${endIsoDate}T00:00:00.000Z`);

    const rows = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        type: 'income',
        status: 'received',
        paidAt: { gte: start, lte: end },
      },
      include: entryInclude,
      orderBy: { paidAt: 'desc' },
    });

    return rows.map((row) => this.toLoaded(row));
  }

  async listEntriesForCashflowInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<CashflowDashboardListItem[]> {
    const rows = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        status: { not: 'cancelled' },
        OR: [
          { paidAt: { gte: range.startAt, lte: range.endAt } },
          { dueDate: { gte: range.startAt, lte: range.endAt } },
        ],
      },
      select: {
        id: true,
        type: true,
        dueDate: true,
        paidAt: true,
        valueCents: true,
        paidValueCents: true,
      },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      dueDate: row.dueDate,
      paidAt: row.paidAt,
      valueCents: row.valueCents,
      paidValueCents: row.paidValueCents,
    }));
  }

  async listCashflowYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT year FROM (
        SELECT EXTRACT(YEAR FROM due_date AT TIME ZONE 'UTC')::int AS year
        FROM beautiful.financial_entries
        WHERE store_id = ${storeId} AND status <> 'cancelled'
        UNION
        SELECT EXTRACT(YEAR FROM paid_at AT TIME ZONE 'UTC')::int AS year
        FROM beautiful.financial_entries
        WHERE store_id = ${storeId}
          AND status <> 'cancelled'
          AND paid_at IS NOT NULL
      ) years
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  async listTicketMedioDayMetricsInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date; todayKey: string },
  ): Promise<TicketMedioDayMetricRow[]> {
    const todayEnd = new Date(`${range.todayKey}T23:59:59.999Z`);
    const endAt = range.endAt < todayEnd ? range.endAt : todayEnd;

    const rows = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        status: { not: 'cancelled' },
        paidAt: { gte: range.startAt, lte: endAt },
        OR: [
          { type: 'income', status: 'received' },
          { type: 'expense', status: 'paid' },
        ],
      },
      select: {
        type: true,
        status: true,
        paidAt: true,
        valueCents: true,
        paidValueCents: true,
        clientId: true,
      },
      orderBy: [{ paidAt: 'asc' }, { id: 'asc' }],
    });

    const byDate = new Map<
      string,
      { revenueCents: number; expenseCents: number; clientIds: Set<string> }
    >();

    for (const row of rows) {
      if (!row.paidAt) continue;
      const dateKey = row.paidAt.toISOString().slice(0, 10);
      let bucket = byDate.get(dateKey);
      if (!bucket) {
        bucket = {
          revenueCents: 0,
          expenseCents: 0,
          clientIds: new Set<string>(),
        };
        byDate.set(dateKey, bucket);
      }
      const amount = row.paidValueCents ?? row.valueCents;
      if (row.type === 'income' && row.status === 'received') {
        bucket.revenueCents += amount;
        if (row.clientId) bucket.clientIds.add(row.clientId);
      } else if (row.type === 'expense' && row.status === 'paid') {
        bucket.expenseCents += amount;
      }
    }

    return [...byDate.entries()].map(([dateKey, bucket]) => ({
      dateKey,
      revenueCents: bucket.revenueCents,
      expenseCents: bucket.expenseCents,
      clientIds: [...bucket.clientIds],
    }));
  }

  async listTicketMedioYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM paid_at AT TIME ZONE 'UTC')::int AS year
      FROM beautiful.financial_entries
      WHERE store_id = ${storeId}
        AND status <> 'cancelled'
        AND paid_at IS NOT NULL
        AND (
          (type = 'income' AND status = 'received')
          OR (type = 'expense' AND status = 'paid')
        )
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  async listInadimplenciaDebtsInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date; todayKey: string },
  ): Promise<InadimplenciaDashboardDebtRow[]> {
    const todayStart = new Date(`${range.todayKey}T00:00:00.000Z`);

    const delinquentClients = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        type: 'income',
        status: 'pending',
        clientId: { not: null },
        dueDate: { lt: todayStart },
      },
      select: { clientId: true },
      distinct: ['clientId'],
    });

    const clientIds = delinquentClients
      .map((row) => row.clientId)
      .filter((id): id is string => id != null);

    if (clientIds.length === 0) return [];

    const rows = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        type: 'income',
        status: { in: ['pending', 'received'] },
        clientId: { in: clientIds },
        dueDate: { gte: range.startAt, lte: range.endAt },
      },
      select: {
        id: true,
        dueDate: true,
        description: true,
        valueCents: true,
        status: true,
        clientId: true,
        client: { select: { id: true, name: true, phone: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });

    return rows
      .filter(
        (
          row,
        ): row is typeof row & {
          clientId: string;
          client: NonNullable<typeof row.client>;
        } => row.clientId != null && row.client != null,
      )
      .map((row) => ({
        id: row.id,
        dueDate: row.dueDate,
        description: row.description,
        valueCents: row.valueCents,
        status: row.status as 'pending' | 'received',
        clientId: row.clientId,
        clientName: row.client.name,
        phone: row.client.phone || null,
      }));
  }

  async listInadimplenciaYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM due_date AT TIME ZONE 'UTC')::int AS year
      FROM beautiful.financial_entries
      WHERE store_id = ${storeId}
        AND type = 'income'
        AND status IN ('pending', 'received')
        AND client_id IS NOT NULL
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  async listExpenseByCategoryInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<ExpenseByCategoryAggRow[]> {
    const rows = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        type: 'expense',
        status: 'paid',
        paidAt: { gte: range.startAt, lte: range.endAt },
      },
      select: {
        valueCents: true,
        paidValueCents: true,
        expenseCategoryId: true,
        expenseCategory: { select: { id: true, name: true, color: true } },
      },
    });

    return rows.map((row) => ({
      categoryId: row.expenseCategoryId,
      categoryName: row.expenseCategory?.name ?? null,
      categoryColor: row.expenseCategory?.color ?? null,
      amountCents: row.paidValueCents ?? row.valueCents,
    }));
  }

  async listExpenseByCategoryYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM paid_at AT TIME ZONE 'UTC')::int AS year
      FROM beautiful.financial_entries
      WHERE store_id = ${storeId}
        AND type = 'expense'
        AND status = 'paid'
        AND paid_at IS NOT NULL
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  private toLoaded(row: EntryRow & EntryInclude): FinancialEntryLoaded {
    return {
      entry: this.toEntity(row),
      account: row.account,
      expenseCategory: row.expenseCategory,
      incomeCategory: row.incomeCategory,
      client: row.client
        ? {
            id: row.client.id,
            name: row.client.name,
            phone: row.client.phone || null,
          }
        : null,
    };
  }

  private toEntity(row: EntryRow): FinancialEntry {
    return FinancialEntry.create(
      {
        storeId: row.storeId,
        type: row.type,
        status: row.status,
        source: row.source,
        description: row.description,
        valueCents: row.valueCents,
        dueDate: row.dueDate,
        paidAt: row.paidAt,
        paidValueCents: row.paidValueCents,
        paymentMethod: row.paymentMethod,
        paymentType: row.paymentType,
        observation: row.observation,
        accountId: row.accountId,
        expenseCategoryId: row.expenseCategoryId,
        incomeCategoryId: row.incomeCategoryId,
        clientId: row.clientId,
        appointmentId: row.appointmentId,
        installmentNumber: row.installmentNumber,
        totalInstallments: row.totalInstallments,
        recurrenceGroupId: row.recurrenceGroupId,
        receiveDetail:
          (row.receiveDetail as FinancialEntryReceiveDetail | null) ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toPersistence(
    entry: FinancialEntry,
  ): Prisma.FinancialEntryUncheckedCreateInput {
    return {
      id: entry.id,
      storeId: entry.storeId,
      type: entry.type,
      status: entry.status,
      source: entry.source,
      description: entry.description,
      valueCents: entry.valueCents,
      dueDate: entry.dueDate,
      paidAt: entry.paidAt,
      paidValueCents: entry.paidValueCents,
      paymentMethod: entry.paymentMethod,
      paymentType: entry.paymentType,
      observation: entry.observation,
      accountId: entry.accountId,
      expenseCategoryId: entry.expenseCategoryId,
      incomeCategoryId: entry.incomeCategoryId,
      clientId: entry.clientId,
      appointmentId: entry.appointmentId,
      installmentNumber: entry.installmentNumber,
      totalInstallments: entry.totalInstallments,
      recurrenceGroupId: entry.recurrenceGroupId,
      receiveDetail:
        entry.receiveDetail === null
          ? Prisma.DbNull
          : (entry.receiveDetail as Prisma.InputJsonValue),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
