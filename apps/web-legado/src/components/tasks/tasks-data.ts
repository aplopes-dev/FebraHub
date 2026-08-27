import type { Task as ApiTask, TaskPriority, TaskTab, TaskType } from "@/types/api/task";

export type { TaskPriority, TaskTab, TaskType };

/** Shape de apresentação usado pelos componentes de /tarefas. */
export type Task = {
  id: string;
  titulo: string;
  tipo: TaskType;
  negocio: string;
  customer: string;
  contato: string;
  responsavel: string;
  assigneeUserId: string | null;
  subjectType: "deal" | null;
  subjectId: string | null;
  dueAt: string;
  prioridade: TaskPriority;
  concluida: boolean;
  resultado?: string;
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  ligacao: "Ligação",
  reuniao: "Reunião",
  follow_up: "Follow-up",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export function todayDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function mapApiTaskToUi(task: ApiTask): Task {
  return {
    id: task.id,
    titulo: task.title,
    tipo: task.type,
    negocio: task.dealTitle ?? "",
    customer: task.customerName ?? "",
    contato: "",
    responsavel: task.assigneeName ?? "—",
    assigneeUserId: task.assigneeUserId,
    subjectType: task.subjectType,
    subjectId: task.subjectId,
    dueAt: task.dueAt,
    prioridade: task.priority,
    concluida: task.completedAt !== null,
    resultado: task.result ?? undefined,
  };
}

function toDateKey(iso: string) {
  return todayDateKey(new Date(iso));
}

export function getTaskTab(task: Task, hoje = todayDateKey()): TaskTab {
  if (task.concluida) return "concluidas";
  const due = toDateKey(task.dueAt);
  if (due === hoje) return "hoje";
  if (due < hoje) return "atrasadas";
  return "proximas";
}

export function filterTasksByTab(
  tasks: Task[],
  tab: TaskTab,
  hoje = todayDateKey(),
) {
  return tasks
    .filter((task) => getTaskTab(task, hoje) === tab)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export function getTabCounts(tasks: Task[], hoje = todayDateKey()) {
  return {
    hoje: filterTasksByTab(tasks, "hoje", hoje).length,
    atrasadas: filterTasksByTab(tasks, "atrasadas", hoje).length,
    proximas: filterTasksByTab(tasks, "proximas", hoje).length,
    concluidas: filterTasksByTab(tasks, "concluidas", hoje).length,
  };
}

export function formatTaskDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function suggestNextDueAt(daysAhead = 3) {
  const base = new Date();
  base.setHours(10, 0, 0, 0);
  base.setDate(base.getDate() + daysAhead);
  return base.toISOString();
}
