import type { CancelledAppointmentTask } from '../types/cancelled-appointment-task';

/** Remove tarefas ignoradas localmente (sessionStorage). Período vem do servidor. */
export function filterIgnoredCancelledAppointmentTasks(
  tasks: readonly CancelledAppointmentTask[],
  ignoredIds: ReadonlySet<string>,
): CancelledAppointmentTask[] {
  return tasks.filter((task) => !ignoredIds.has(task.id));
}
