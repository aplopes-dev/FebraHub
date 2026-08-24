import type { IndicacoesFirstAppointmentStatus } from './indicacoes.types';

const AGENDADA_STATUSES = new Set([
  'scheduled',
  'confirmed',
  'patient_waiting',
  'in_progress',
]);

/**
 * Mapeia o status da 1ª consulta não-cancelada para o badge da UI Indicações.
 */
export function mapFirstAppointmentStatus(
  appointmentStatus: string | null | undefined,
): IndicacoesFirstAppointmentStatus {
  if (!appointmentStatus) return 'nao_realizada';
  if (appointmentStatus === 'finished') return 'realizada';
  if (appointmentStatus === 'missed') return 'nao_realizada';
  if (AGENDADA_STATUSES.has(appointmentStatus)) return 'agendada';
  return 'nao_realizada';
}
