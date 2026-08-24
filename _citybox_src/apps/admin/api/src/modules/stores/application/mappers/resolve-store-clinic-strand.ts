import {
  DEFAULT_CLINIC_STRAND,
  parseClinicStrand,
  type ClinicStrand,
} from '@citybox/messaging';
import { InvalidClinicStrandError } from '../../domain/errors/invalid-clinic-strand.error';

/**
 * Clínica sem valor → odontologia. Outra vertical → null (ignora o body).
 * Valor inválido em Clínica → 422.
 */
export function resolveStoreClinicStrand(
  vertical: string,
  raw: string | null | undefined,
  context: string,
): ClinicStrand | null {
  if (vertical !== 'Clínica') {
    return null;
  }
  const parsed = parseClinicStrand(raw);
  if (parsed === null) {
    throw new InvalidClinicStrandError(context, String(raw));
  }
  return parsed ?? DEFAULT_CLINIC_STRAND;
}
