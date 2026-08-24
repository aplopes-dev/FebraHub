import type { Prisma } from '../../../../../../generated/prisma/client';
import type { PatientAnamnesisListCriteria } from '../../domain/repositories/patient-anamnesis.repository.interface';

export function buildPatientAnamnesisListWhere(
  storeId: string,
  patientId: string,
  criteria: Pick<PatientAnamnesisListCriteria, 'search'>,
): Prisma.PatientAnamnesisWhereInput {
  const search = criteria.search?.trim();
  const where: Prisma.PatientAnamnesisWhereInput = { storeId, patientId };

  if (search) {
    where.templateName = { contains: search, mode: 'insensitive' };
  }

  return where;
}

export function buildPatientAnamnesisListOrderBy(
  criteria: Pick<PatientAnamnesisListCriteria, 'sortBy' | 'sortOrder'>,
): Prisma.PatientAnamnesisOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';

  switch (criteria.sortBy) {
    case 'templateName':
      return { templateName: sortOrder };
    case 'issuedAt':
    default:
      return { issuedAt: sortOrder };
  }
}
