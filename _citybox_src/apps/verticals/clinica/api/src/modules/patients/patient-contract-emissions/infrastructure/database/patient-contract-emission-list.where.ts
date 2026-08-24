import type { Prisma } from '../../../../../../generated/prisma/client';
import type { PatientContractEmissionListCriteria } from '../../domain/repositories/patient-contract-emission.repository.interface';

export function buildPatientContractEmissionListWhere(
  storeId: string,
  patientId: string,
  criteria: Pick<PatientContractEmissionListCriteria, 'search'>,
): Prisma.PatientContractEmissionWhereInput {
  const search = criteria.search?.trim();
  const where: Prisma.PatientContractEmissionWhereInput = {
    storeId,
    patientId,
  };

  if (search) {
    where.templateName = { contains: search, mode: 'insensitive' };
  }

  return where;
}

export function buildPatientContractEmissionListOrderBy(
  criteria: Pick<PatientContractEmissionListCriteria, 'sortBy' | 'sortOrder'>,
): Prisma.PatientContractEmissionOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';

  switch (criteria.sortBy) {
    case 'templateName':
      return { templateName: sortOrder };
    case 'issuedAt':
    default:
      return { issuedAt: sortOrder };
  }
}
