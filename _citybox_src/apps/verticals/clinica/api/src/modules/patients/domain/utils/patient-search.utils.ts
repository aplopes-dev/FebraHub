import { onlyDigits } from '../../../../shared/core/utils/brazilian-document.utils';

const NUMERIC_SEARCH_SEPARATORS = /[\s.\-/()]/g;

export type PatientSearchable = {
  name: string;
  cpf: string | null;
  phone: string;
  landlinePhone: string;
};

export type PatientSearchFilter =
  | { type: 'name'; term: string }
  | { type: 'numeric'; digits: string };

/** True when the query is only digits plus common CPF/phone formatting chars. */
export function isNumericPatientSearch(search: string): boolean {
  const trimmed = search.trim();
  const digits = onlyDigits(trimmed);
  if (digits.length === 0) return false;
  return trimmed.replace(NUMERIC_SEARCH_SEPARATORS, '') === digits;
}

export function resolvePatientSearchFilter(
  search: string,
): PatientSearchFilter {
  const trimmed = search.trim();
  if (isNumericPatientSearch(trimmed)) {
    return { type: 'numeric', digits: onlyDigits(trimmed) };
  }
  return { type: 'name', term: trimmed };
}

export function matchesPatientSearch(
  patient: PatientSearchable,
  search: string,
): boolean {
  const trimmed = search.trim();
  if (!trimmed) return true;

  const filter = resolvePatientSearchFilter(trimmed);

  if (filter.type === 'name') {
    return patient.name.toLowerCase().includes(filter.term.toLowerCase());
  }

  if (filter.digits.length === 11 && patient.cpf === filter.digits) {
    return true;
  }

  return (
    patient.phone === filter.digits || patient.landlinePhone === filter.digits
  );
}
