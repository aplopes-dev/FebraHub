import type { Prisma } from '../../../../../../generated/prisma/client';
import type { BudgetListCriteria } from '../../domain/repositories/budget.repository.interface';

export function buildBudgetListWhere(
  storeId: string,
  patientId: string,
  criteria: Pick<BudgetListCriteria, 'search'>,
): Prisma.BudgetWhereInput {
  const search = criteria.search?.trim();
  const where: Prisma.BudgetWhereInput = { storeId, patientId };

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { responsibleName: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function buildBudgetListOrderBy(
  criteria: Pick<BudgetListCriteria, 'sortBy' | 'sortOrder'>,
): Prisma.BudgetOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';

  switch (criteria.sortBy) {
    case 'description':
      return { description: sortOrder };
    case 'finalValueCents':
      return { finalValueCents: sortOrder };
    case 'status':
      return { status: sortOrder };
    case 'date':
    default:
      return { date: sortOrder };
  }
}
