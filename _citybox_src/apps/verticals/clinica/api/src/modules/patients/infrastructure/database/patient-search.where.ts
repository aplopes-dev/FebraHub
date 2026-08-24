import type { Prisma } from '../../../../../generated/prisma/client';
import { resolvePatientSearchFilter } from '../../domain/utils/patient-search.utils';

export function buildPatientSearchWhere(
  search: string,
): Pick<Prisma.PatientWhereInput, 'OR' | 'name'> {
  const filter = resolvePatientSearchFilter(search);

  if (filter.type === 'name') {
    return { name: { contains: filter.term, mode: 'insensitive' } };
  }

  const or: Prisma.PatientWhereInput[] = [];
  if (filter.digits.length === 11) {
    or.push({ cpf: filter.digits });
  }
  or.push({ phone: filter.digits }, { landlinePhone: filter.digits });
  return { OR: or };
}
