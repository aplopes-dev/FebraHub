/**
 * Porta de entrada de dados da feature calendar — consome imoveis-api.
 */
import type { MonthRef } from '@/features/shared/utils/calendar';
import { ImoveisApiError, imoveisFetch } from '@/lib/imoveis-api';
import type {
  AppointmentWriteInput,
  CalendarAppointment,
  ListAppointmentsParams,
  ListAppointmentsResult,
} from '../types';

const BAHIA_OFFSET = '-03:00';

function csv(values?: readonly string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}

function buildListQuery(params: ListAppointmentsParams): string {
  const q = new URLSearchParams();
  q.set('from', params.from);
  q.set('to', params.to);
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.agentId) q.set('agentId', params.agentId);
  if (params.excludeAgentId) q.set('excludeAgentId', params.excludeAgentId);
  const kind = csv(params.kind);
  if (kind) q.set('kind', kind);
  if (params.done !== undefined) q.set('done', String(params.done));
  return `?${q.toString()}`;
}

/** date YYYY-MM-DD + HH:mm → ISO com offset America/Bahia (−03). */
export function toBahiaIso(date: string, time: string): string {
  const hhmm = /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  return `${date}T${hhmm}:00.000${BAHIA_OFFSET}`;
}

function toApiBody(input: AppointmentWriteInput) {
  return {
    title: input.title,
    description: input.description,
    startsAt: toBahiaIso(input.date, input.startTime),
    endsAt: toBahiaIso(input.date, input.endTime),
    location: input.location,
    kind: input.kind,
    agentId: input.agentId,
    done: input.done ?? false,
    leadId: input.leadId ?? null,
    leadName: input.leadName ?? null,
    leadEmail: input.leadEmail ?? null,
    leadPhone: input.leadPhone ?? null,
    leadPhotoUrl: input.leadPhotoUrl ?? null,
    propertyId: input.propertyId ?? null,
  };
}

export async function listAppointments(
  params: ListAppointmentsParams,
): Promise<ListAppointmentsResult> {
  return imoveisFetch<ListAppointmentsResult>(
    `/v1/appointments${buildListQuery(params)}`,
  );
}

export async function getAppointmentById(
  id: string,
): Promise<CalendarAppointment | null> {
  try {
    const res = await imoveisFetch<{ data: CalendarAppointment }>(
      `/v1/appointments/${id}`,
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function createAppointment(
  input: AppointmentWriteInput,
): Promise<CalendarAppointment> {
  const res = await imoveisFetch<{ data: CalendarAppointment }>(
    '/v1/appointments',
    {
      method: 'POST',
      body: JSON.stringify(toApiBody(input)),
    },
  );
  return res.data;
}

export async function updateAppointment(
  id: string,
  input: AppointmentWriteInput,
): Promise<CalendarAppointment | null> {
  try {
    const res = await imoveisFetch<{ data: CalendarAppointment }>(
      `/v1/appointments/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(toApiBody(input)),
      },
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    await imoveisFetch<void>(`/v1/appointments/${id}`, { method: 'DELETE' });
    return true;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return false;
    throw err;
  }
}

export async function toggleAppointmentDone(
  appointment: CalendarAppointment,
): Promise<CalendarAppointment | null> {
  return updateAppointment(appointment.id, {
    title: appointment.title,
    description: appointment.description,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    location: appointment.location,
    kind: appointment.kind,
    agentId: appointment.agentId,
    leadId: appointment.leadId,
    leadName: appointment.leadName,
    leadEmail: appointment.leadEmail,
    leadPhone: appointment.leadPhone,
    leadPhotoUrl: appointment.leadPhotoUrl,
    propertyId: appointment.propertyId,
    done: !appointment.done,
  });
}

/** Deriva marked days a partir de uma lista já carregada. */
export function markedDaysFromAppointments(
  appointments: readonly CalendarAppointment[],
  month: MonthRef,
): readonly number[] {
  const prefix = `${month.year}-${String(month.month + 1).padStart(2, '0')}-`;
  const days = new Set<number>();
  for (const item of appointments) {
    if (!item.date.startsWith(prefix)) continue;
    const day = Number(item.date.slice(8, 10));
    if (day > 0) days.add(day);
  }
  return [...days].sort((a, b) => a - b);
}

/** Converte HH:mm em minutos desde meia-noite. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function addDaysIso(isoDate: string, amount: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + amount);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Segunda-feira da semana que contém `isoDate`. */
export function getWeekStart(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoToDisplay(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export function displayToIso(display: string): string | null {
  const match = display.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

export function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Último dia do mês civil (month 0-based). */
export function monthRangeIso(month: MonthRef): { from: string; to: string } {
  const from = `${month.year}-${String(month.month + 1).padStart(2, '0')}-01`;
  const last = new Date(month.year, month.month + 1, 0).getDate();
  const to = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}
