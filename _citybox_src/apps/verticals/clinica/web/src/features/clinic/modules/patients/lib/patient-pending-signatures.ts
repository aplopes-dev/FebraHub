import type { ElectronicSignatureKind } from '../types/electronic-signature';

const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

export const PATIENT_SIGNATURE_KIND_LABEL: Record<
  ElectronicSignatureKind,
  string
> = {
  anamnesis: 'Anamnese',
  contract: 'Contrato',
  evolution_batch: 'Evolução',
};

/** Data civil `yyyy-MM-dd` no fuso da clínica. */
export function civilDateInClinicTimeZone(instant: Date | string): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Dias civis desde `requestedAt` até `now` (fuso clínica).
 * Ex.: `0 dias pendentes`, `1 dia pendente`, `5 dias pendentes`.
 */
export function formatPendingSignatureDaysLabel(
  requestedAt: string,
  now: Date = new Date(),
): string {
  const start = civilDateInClinicTimeZone(requestedAt);
  const end = civilDateInClinicTimeZone(now);
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const days = Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));

  if (days === 1) return '1 dia pendente';
  return `${days} dias pendentes`;
}

/** `dd/MM/yyyy` a partir de ISO, no fuso da clínica. */
export function formatSignatureRequestedAtDate(isoDate: string): string {
  const [year, month, day] = civilDateInClinicTimeZone(isoDate).split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}
