import type { ListAppointmentsParams, ScheduleListFilter } from '../types';

/** Aplica filtro de corretor — cada sessão vê a própria agenda (`mine` por padrão). */
export function buildAppointmentListParams(
  range: { from: string; to: string },
  sessionUserId: string,
  filter: ScheduleListFilter = 'mine',
): ListAppointmentsParams {
  const base: ListAppointmentsParams = { from: range.from, to: range.to };
  if (!sessionUserId) return base;
  if (filter === 'mine') return { ...base, agentId: sessionUserId };
  if (filter === 'assigned') return { ...base, excludeAgentId: sessionUserId };
  // `all` = visão da loja (só admin/dono; API interpreta `agentId=all`).
  return { ...base, agentId: 'all' };
}
