import type { CancelledAppointmentTasksListParams } from '../services/cancelled-appointment-tasks.service';

export const cancelledAppointmentTaskKeys = {
  all: (storeId: string) =>
    ['clinic-dashboard', 'tasks', 'cancelled-appointments', storeId] as const,
  list: (storeId: string, params: CancelledAppointmentTasksListParams) =>
    [...cancelledAppointmentTaskKeys.all(storeId), params] as const,
};
