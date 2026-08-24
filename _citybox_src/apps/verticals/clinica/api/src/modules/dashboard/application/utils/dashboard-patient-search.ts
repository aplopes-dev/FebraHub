import type { Prisma } from '../../../../../generated/prisma/client';
import {
  matchesPatientSearch,
  resolvePatientSearchFilter,
  type PatientSearchable,
} from '../../../patients/domain/utils/patient-search.utils';

export type DashboardPatientSearchable = PatientSearchable & {
  email: string;
};

/**
 * Search for dashboard patient lists: name/email (text) or CPF/phone (numeric).
 */
export function buildDashboardPatientSearchWhere(
  search: string,
): Prisma.PatientWhereInput {
  const filter = resolvePatientSearchFilter(search);

  if (filter.type === 'name') {
    return {
      OR: [
        { name: { contains: filter.term, mode: 'insensitive' } },
        { email: { contains: filter.term, mode: 'insensitive' } },
      ],
    };
  }

  const or: Prisma.PatientWhereInput[] = [];
  if (filter.digits.length === 11) {
    or.push({ cpf: filter.digits });
  }
  or.push({ phone: filter.digits }, { landlinePhone: filter.digits });
  return { OR: or };
}

export function matchesDashboardPatientSearch(
  patient: DashboardPatientSearchable,
  search: string,
): boolean {
  const trimmed = search.trim();
  if (!trimmed) return true;

  const filter = resolvePatientSearchFilter(trimmed);
  if (filter.type === 'name') {
    const term = filter.term.toLowerCase();
    return (
      patient.name.toLowerCase().includes(term) ||
      patient.email.toLowerCase().includes(term)
    );
  }

  return matchesPatientSearch(patient, trimmed);
}
