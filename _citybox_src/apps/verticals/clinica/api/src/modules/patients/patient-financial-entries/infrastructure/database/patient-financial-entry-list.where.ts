import type { Prisma } from '../../../../../../generated/prisma/client';
import type {
  PatientFinancialEntryListCriteria,
  PatientFinancialEntryTotalsCriteria,
} from '../../domain/repositories/patient-financial-entry.repository.interface';

function buildPeriodFilter(
  periodFrom?: string,
  periodTo?: string,
): Prisma.DateTimeFilter | undefined {
  if (!periodFrom && !periodTo) {
    return undefined;
  }

  const date: Prisma.DateTimeFilter = {};
  if (periodFrom) {
    date.gte = new Date(`${periodFrom}T00:00:00.000Z`);
  }
  if (periodTo) {
    date.lte = new Date(`${periodTo}T00:00:00.000Z`);
  }
  return date;
}

/** Ficha: apenas receitas do paciente (ledger unificado). */
export function buildPatientFinancialEntryListWhere(
  storeId: string,
  patientId: string,
  criteria: Pick<
    PatientFinancialEntryListCriteria,
    'search' | 'status' | 'periodFrom' | 'periodTo' | 'budgetItemId'
  >,
): Prisma.FinancialEntryWhereInput {
  const where: Prisma.FinancialEntryWhereInput = {
    storeId,
    patientId,
    type: 'income',
    status: { in: ['pending', 'received'] },
  };

  const search = criteria.search?.trim();
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  if (criteria.status) {
    where.status = criteria.status;
  }

  if (criteria.budgetItemId) {
    where.budgetItemId = criteria.budgetItemId;
  }

  const dueDate = buildPeriodFilter(criteria.periodFrom, criteria.periodTo);
  if (dueDate) {
    where.dueDate = dueDate;
  }

  return where;
}

export function buildPatientFinancialEntryTotalsWhere(
  storeId: string,
  patientId: string,
  criteria: PatientFinancialEntryTotalsCriteria,
): Prisma.FinancialEntryWhereInput {
  const where: Prisma.FinancialEntryWhereInput = {
    storeId,
    patientId,
    type: 'income',
    status: { in: ['pending', 'received'] },
  };

  const dueDate = buildPeriodFilter(criteria.periodFrom, criteria.periodTo);
  if (dueDate) {
    where.dueDate = dueDate;
  }

  return where;
}

export function buildPatientFinancialEntryListOrderBy(
  criteria: Pick<
    PatientFinancialEntryListCriteria,
    'sortBy' | 'sortOrder'
  >,
): Prisma.FinancialEntryOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';

  switch (criteria.sortBy) {
    case 'name':
      return { description: sortOrder };
    case 'valueCents':
      return { valueCents: sortOrder };
    case 'status':
      return { status: sortOrder };
    case 'date':
    default:
      return { dueDate: sortOrder };
  }
}
