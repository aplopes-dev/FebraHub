import type { Prisma } from '../../../../../../generated/prisma/client';
import type { PatientPrescriptionListCriteria } from '../../domain/repositories/patient-prescription.repository.interface';

export function buildPatientPrescriptionListWhere(
  storeId: string,
  patientId: string,
  criteria: Pick<PatientPrescriptionListCriteria, 'search'>,
): Prisma.PatientPrescriptionWhereInput {
  const search = criteria.search?.trim();
  const where: Prisma.PatientPrescriptionWhereInput = { storeId, patientId };

  if (search) {
    where.professionalName = { contains: search, mode: 'insensitive' };
  }

  return where;
}

export function buildPatientPrescriptionListOrderBy(
  criteria: Pick<PatientPrescriptionListCriteria, 'sortBy' | 'sortOrder'>,
): Prisma.PatientPrescriptionOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';

  switch (criteria.sortBy) {
    case 'professionalName':
      return { professionalName: sortOrder };
    case 'issuedDate':
    default:
      return { issuedDate: sortOrder };
  }
}
