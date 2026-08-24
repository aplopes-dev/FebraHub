export interface FunnelStage {
  id?: string;
  name: string;
  type: string;
  color: string;
  order: number;
}

export interface FunnelStageFull {
  id: string;
  name: string;
  type: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Funnel {
  id: string;
  name: string;
  isDefault: boolean;
  /** Alias de storeId da clinica-api (compat UI/marketing). */
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
  stages: FunnelStageFull[];
}

export interface CreateFunnelData {
  name: string;
  stages?: FunnelStage[];
}

export interface UpdateFunnelData {
  name?: string;
  stages?: FunnelStage[];
}

export interface Opportunity {
  id: string;
  funnelId: string;
  stageId: string;
  clinicId: string;
  title: string;
  description?: string;
  phone?: string;
  origin?: string;
  nextContact?: Date;
  patientId?: string;
  labelId?: string;
  submissionId?: string;
  budgetId?: string;
  campaign?: {
    id: string;
    name: string;
  };
  sortOrder: number;
  isDeletable: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastInteraction?: Date;
  patient?: {
    name: string;
    phone?: string;
    email?: string;
  };
}

export interface CreateOpportunityData {
  funnelId: string;
  stageId: string;
  title: string;
  description?: string;
  phone?: string;
  origin?: string;
  nextContact?: Date;
  patientId?: string;
  labelId?: string;
}

export interface UpdateOpportunityData {
  title?: string;
  description?: string;
  phone?: string;
  origin?: string;
  nextContact?: Date | null;
  patientId?: string | null;
  labelId?: string | null;
  stageId?: string;
}

export interface ListOpportunitiesFilters {
  funnelId?: string;
  stageId?: string;
  patientId?: string;
  period?: "all" | "this_week" | "this_month" | "custom";
  startDate?: Date;
  endDate?: Date;
  labelId?: string;
  origin?: string;
  nextContactDate?: Date;
  search?: string;
}

export interface Label {
  id: string;
  clinicId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabelData {
  name: string;
  color: string;
}

export interface UpdateLabelData {
  name?: string;
  color?: string;
}

export interface HistoryEntry {
  id: string;
  actionType: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  isSystemAction: boolean;
  systemName?: string;
  createdAt: string;
}
