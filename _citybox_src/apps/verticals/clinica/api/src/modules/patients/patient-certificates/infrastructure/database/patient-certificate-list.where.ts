import type { Prisma } from '../../../../../../generated/prisma/client';
import type { PatientCertificateListCriteria } from '../../domain/repositories/patient-certificate.repository.interface';

export function buildPatientCertificateListWhere(
  storeId: string,
  patientId: string,
  criteria: Pick<PatientCertificateListCriteria, 'search'>,
): Prisma.PatientCertificateWhereInput {
  const search = criteria.search?.trim();
  const where: Prisma.PatientCertificateWhereInput = { storeId, patientId };

  if (search) {
    where.professionalName = { contains: search, mode: 'insensitive' };
  }

  return where;
}

export function buildPatientCertificateListOrderBy(
  criteria: Pick<PatientCertificateListCriteria, 'sortBy' | 'sortOrder'>,
): Prisma.PatientCertificateOrderByWithRelationInput {
  const sortOrder = criteria.sortOrder ?? 'desc';

  switch (criteria.sortBy) {
    case 'type':
      return { type: sortOrder };
    case 'issuedDate':
    default:
      return { issuedDate: sortOrder };
  }
}
