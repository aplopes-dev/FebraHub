// ========== Kanban Column Types ==========
export type ColumnType = "open" | "in_progress" | "completed" | "lost" | "custom";

export interface KanbanColumn {
  id: string;
  name: string;
  type: ColumnType;
  order: number;
  isEditable: boolean;
  isDraggable: boolean;
  color?: string; // Cor da etapa (hex)
}

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  columnId: string;
  patientName?: string;
  patientId?: string;
  patientAvatar?: string;
  phone?: string;
  origin?: string;
  description?: string;
  lastInteraction?: Date;
  nextContact?: Date;
  submissionId?: string;
  budgetId?: string;
  campaignId?: string;
  campaignName?: string;
  label?: CardLabel;
  sortOrder: number;
  createdAt: Date;
  createdBy?: OpportunityUser;
}

// ========== User Types ==========
export interface OpportunityUser {
  id: string;
  name: string;
  avatar?: string;
}

// ========== History & Comments Types ==========
export type HistoryActionType =
  | "created"
  | "moved"
  | "comment"
  | "label_changed"
  | "contact_scheduled"
  | "updated";

export interface HistoryChangedField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface HistoryItem {
  id: string;
  type: HistoryActionType;
  user?: OpportunityUser; // Opcional quando for ação do sistema
  createdAt: Date;
  content?: string; // Para comentários
  isSystemAction?: boolean; // Indica se a ação foi feita pelo sistema
  systemName?: string; // Nome do sistema quando for ação automática
  metadata?: {
    fromColumn?: string;
    toColumn?: string;
    fromLabel?: string;
    toLabel?: string;
    changedFields?: HistoryChangedField[];
  };
}

// ========== Funnel Types ==========
export interface Funnel {
  id: string;
  name: string;
  isDefault?: boolean;
  completedColumnName: string;
  columns: KanbanColumn[];
}

export interface FunnelOption {
  value: string;
  label: string;
}

export type PeriodFilter = "all" | "this_week" | "this_month" | "custom";

export interface PeriodOption {
  value: PeriodFilter;
  label: string;
}

// ========== Default Columns Factory ==========
export function createDefaultColumns(completedName: string): KanbanColumn[] {
  return [
    {
      id: `col-open-${Date.now()}`,
      name: "Em aberto",
      type: "open",
      order: 0,
      isEditable: true,
      isDraggable: true,
    },
    {
      id: `col-progress-${Date.now()}`,
      name: "Em andamento",
      type: "in_progress",
      order: 1,
      isEditable: true,
      isDraggable: true,
    },
    {
      id: `col-completed-${Date.now()}`,
      name: completedName,
      type: "completed",
      order: 998,
      isEditable: false,
      isDraggable: false,
    },
    {
      id: `col-lost-${Date.now()}`,
      name: "Perdida",
      type: "lost",
      order: 999,
      isEditable: false,
      isDraggable: false,
    },
  ];
}

// ========== Default Funnels ==========
export const DEFAULT_FUNNELS: Funnel[] = [
  {
    id: "funnel-1",
    name: "Funil de Agendamento",
    isDefault: true,
    completedColumnName: "Agendada",
    columns: [
      { id: "col-1-1", name: "Em aberto", type: "open", order: 0, isEditable: true, isDraggable: true },
      { id: "col-1-2", name: "Em andamento", type: "in_progress", order: 1, isEditable: true, isDraggable: true },
      { id: "col-1-3", name: "Agendada", type: "completed", order: 998, isEditable: false, isDraggable: false },
      { id: "col-1-4", name: "Perdida", type: "lost", order: 999, isEditable: false, isDraggable: false },
    ],
  },
  {
    id: "funnel-2",
    name: "Funil de Venda",
    isDefault: true,
    completedColumnName: "Ganha",
    columns: [
      { id: "col-2-1", name: "Em aberto", type: "open", order: 0, isEditable: true, isDraggable: true },
      { id: "col-2-2", name: "Em andamento", type: "in_progress", order: 1, isEditable: true, isDraggable: true },
      { id: "col-2-3", name: "Ganha", type: "completed", order: 998, isEditable: false, isDraggable: false },
      { id: "col-2-4", name: "Perdida", type: "lost", order: 999, isEditable: false, isDraggable: false },
    ],
  },
];

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "all", label: "Todo período" },
  { value: "this_week", label: "Dessa semana" },
  { value: "this_month", label: "Desse mês" },
  { value: "custom", label: "Escolher período" },
];
