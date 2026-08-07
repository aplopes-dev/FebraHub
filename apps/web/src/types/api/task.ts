export type TaskSubjectType = "deal";
export type TaskType = "ligacao" | "reuniao" | "follow_up";
export type TaskPriority = "alta" | "media" | "baixa";
export type TaskTab = "hoje" | "atrasadas" | "proximas" | "concluidas";

export type Task = {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  dueAt: string;
  completedAt: string | null;
  result: string | null;
  subjectType: TaskSubjectType | null;
  subjectId: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  createdByUserId: string | null;
  dealTitle: string | null;
  customerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListTasksParams = {
  tab?: TaskTab;
  /** UUID do responsável, omitir = usuário logado, "all" = todos */
  assigneeUserId?: string;
  subjectType?: TaskSubjectType;
  subjectId?: string;
  type?: TaskType;
  priority?: TaskPriority;
  q?: string;
};

export type CreateTaskInput = {
  title: string;
  type: TaskType;
  dueAt: string;
  priority?: TaskPriority;
  subjectType?: TaskSubjectType | null;
  subjectId?: string | null;
  assigneeUserId?: string | null;
};

export type UpdateTaskInput = {
  title?: string;
  type?: TaskType;
  dueAt?: string;
  priority?: TaskPriority;
  subjectType?: TaskSubjectType | null;
  subjectId?: string | null;
  assigneeUserId?: string | null;
};

export type CompleteTaskInput = {
  result: string;
  createNext?: boolean;
  nextTitle?: string;
  nextDueAt?: string;
};

export type CompleteTaskResult = {
  task: Task;
  nextTask: Task | null;
};

export type PendingTasksCount = {
  count: number;
};
