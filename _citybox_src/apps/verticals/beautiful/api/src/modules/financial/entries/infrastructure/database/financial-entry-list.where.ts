import type { Prisma } from '../../../../../../generated/prisma/client';
import type {
  FinancialEntryListCriteria,
  FinancialEntryStatsCriteria,
} from '../../domain/repositories/financial-entry.repository.interface';

function buildDateRangeFilter(
  startDate?: string,
  endDate?: string,
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;
  const range: Prisma.DateTimeFilter = {};
  if (startDate) range.gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) range.lte = new Date(`${endDate}T00:00:00.000Z`);
  return range;
}

function mergeDateTimeFilters(
  ...filters: Array<Prisma.DateTimeFilter | undefined>
): Prisma.DateTimeFilter | undefined {
  const defined = filters.filter(Boolean) as Prisma.DateTimeFilter[];
  if (defined.length === 0) return undefined;

  const merged: Prisma.DateTimeFilter = {};
  for (const filter of defined) {
    if (filter.gte !== undefined) {
      const current = merged.gte;
      merged.gte =
        current === undefined || filter.gte > current ? filter.gte : current;
    }
    if (filter.lte !== undefined) {
      const current = merged.lte;
      merged.lte =
        current === undefined || filter.lte < current ? filter.lte : current;
    }
  }
  return merged;
}

export function buildFinancialEntryListWhere(
  storeId: string,
  criteria: Omit<
    FinancialEntryListCriteria,
    'skip' | 'take' | 'sortBy' | 'sortOrder'
  >,
): Prisma.FinancialEntryWhereInput {
  const where: Prisma.FinancialEntryWhereInput = { storeId };
  const dateField = criteria.dateField ?? 'dueDate';
  const periodFilter = buildDateRangeFilter(
    criteria.startDate,
    criteria.endDate,
  );
  const paidAtExtra = buildDateRangeFilter(
    criteria.paidAtFrom,
    criteria.paidAtTo,
  );

  if (dateField === 'paidAt') {
    const paidAt = mergeDateTimeFilters(periodFilter, paidAtExtra);
    if (paidAt) where.paidAt = paidAt;
  } else {
    if (periodFilter) where.dueDate = periodFilter;
    if (paidAtExtra) where.paidAt = paidAtExtra;
  }

  if (criteria.types?.length) where.type = { in: criteria.types };
  if (criteria.statuses?.length) where.status = { in: criteria.statuses };

  if (criteria.accountIds?.length) {
    where.accountId = { in: criteria.accountIds };
  }

  if (criteria.paymentMethods?.length) {
    where.paymentMethod = { in: criteria.paymentMethods };
  }

  if (criteria.categoryIds?.length) {
    where.OR = [
      { expenseCategoryId: { in: criteria.categoryIds } },
      { incomeCategoryId: { in: criteria.categoryIds } },
    ];
  }

  if (criteria.clientId) where.clientId = criteria.clientId;

  const search = criteria.search?.trim();
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  return where;
}

export function buildFinancialEntryStatsWhere(
  storeId: string,
  criteria: FinancialEntryStatsCriteria,
): Prisma.FinancialEntryWhereInput {
  const where: Prisma.FinancialEntryWhereInput = {
    storeId,
    status: { not: 'cancelled' },
  };
  const dueDate = buildDateRangeFilter(criteria.startDate, criteria.endDate);
  if (dueDate) where.dueDate = dueDate;
  return where;
}

export function buildFinancialEntryListOrderBy(
  criteria: Pick<FinancialEntryListCriteria, 'sortBy' | 'sortOrder'>,
): Prisma.FinancialEntryOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';
  switch (criteria.sortBy) {
    case 'description':
      return { description: sortOrder };
    case 'valueCents':
      return { valueCents: sortOrder };
    case 'status':
      return { status: sortOrder };
    case 'dueDate':
    default:
      return { dueDate: sortOrder };
  }
}
