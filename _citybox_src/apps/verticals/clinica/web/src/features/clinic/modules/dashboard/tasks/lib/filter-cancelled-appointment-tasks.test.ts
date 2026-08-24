import { describe, expect, it } from 'vitest';
import { filterIgnoredCancelledAppointmentTasks } from './filter-cancelled-appointment-tasks';
import type { CancelledAppointmentTask } from '../types/cancelled-appointment-task';

const TASKS: CancelledAppointmentTask[] = [
  {
    id: 'a',
    patientId: 'p1',
    patientName: 'Ana',
    patientPhone: '73999999999',
    professionalId: 'pro1',
    professionalName: 'Dra. A',
    appointmentAt: '2026-07-22T10:00:00.000Z',
    durationMin: 30,
    categoryId: null,
    observations: null,
  },
  {
    id: 'b',
    patientId: 'p2',
    patientName: 'Bruno',
    patientPhone: '73988888888',
    professionalId: 'pro2',
    professionalName: 'Dr. B',
    appointmentAt: '2026-07-10T14:00:00.000Z',
    durationMin: 30,
    categoryId: null,
    observations: null,
  },
];

describe('filterIgnoredCancelledAppointmentTasks', () => {
  it('excludes ignored ids', () => {
    const result = filterIgnoredCancelledAppointmentTasks(
      TASKS,
      new Set(['a']),
    );
    expect(result.map((task) => task.id)).toEqual(['b']);
  });

  it('returns all when nothing ignored', () => {
    const result = filterIgnoredCancelledAppointmentTasks(TASKS, new Set());
    expect(result.map((task) => task.id)).toEqual(['a', 'b']);
  });

  it('returns empty when all ignored', () => {
    const result = filterIgnoredCancelledAppointmentTasks(
      TASKS,
      new Set(['a', 'b']),
    );
    expect(result).toEqual([]);
  });
});
