/**
 * Seed mínimo da agenda — dados reais vêm da imoveis-api.
 */
import type { CalendarAppointment } from '../types';

export const EMPTY_APPOINTMENT: CalendarAppointment = {
  id: '',
  title: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  kind: 'visit',
  agentId: '',
  done: false,
};
