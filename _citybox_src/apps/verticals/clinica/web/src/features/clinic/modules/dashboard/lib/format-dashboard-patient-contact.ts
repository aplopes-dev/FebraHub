import { digitsOnly } from '@/features/shared/fiscal/cpf';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { formatPatientCpf } from '@/features/clinic/modules/patients/lib/format-patient-contact';

/** Telefone fixo: `(43) 3474-1420` / `(43) 94744-1420`. */
export function formatDashboardLandlinePhone(
  value: string | null | undefined,
): string {
  const digits = digitsOnly(value ?? '');
  if (!digits) return '';
  return formatPhone(digits);
}

/**
 * Celular com DDI: `+55 43 94744 1420`.
 * Aceita dígitos com ou sem prefixo 55.
 */
export function formatDashboardMobilePhone(
  value: string | null | undefined,
): string {
  let digits = digitsOnly(value ?? '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.length === 11) {
    return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return formatPhone(digits);
}

/** CPF mascarado com prefixo: `CPF 251.124.820-44`. */
export function formatDashboardPatientCpfLabel(
  value: string | null | undefined,
): string {
  const digits = digitsOnly(value ?? '');
  if (!digits) return '';
  return `CPF ${formatPatientCpf(digits)}`;
}
