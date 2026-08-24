import { clinicaFetch } from "@/features/clinic/shared/api";
import { formatLocalDateString } from "@/features/clinic/agenda/lib/local-date";

import type {
  CreateFunnelData,
  CreateLabelData,
  CreateOpportunityData,
  Funnel,
  FunnelStageFull,
  HistoryEntry,
  Label,
  ListOpportunitiesFilters,
  Opportunity,
  UpdateFunnelData,
  UpdateLabelData,
  UpdateOpportunityData,
} from "./sales.types";

type PaginatedMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type FunnelApiResponse = {
  id: string;
  storeId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  stages: Array<{
    id: string;
    name: string;
    type: string;
    color: string;
    order: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

type OpportunityApiResponse = {
  id: string;
  funnelId: string;
  stageId: string;
  storeId: string;
  title: string;
  description?: string;
  phone?: string;
  origin?: string;
  nextContact?: string;
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
  createdAt: string;
  updatedAt: string;
  lastInteraction?: string;
  patient?: {
    name: string;
    phone?: string;
    email?: string;
  };
};

type LabelApiResponse = {
  id: string;
  storeId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type HistoryApiResponse = {
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
};

function toDate(value: string | Date | undefined | null): Date | undefined {
  if (value == null) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function mapStage(stage: FunnelApiResponse["stages"][number]): FunnelStageFull {
  return {
    id: stage.id,
    name: stage.name,
    type: stage.type,
    color: stage.color,
    order: stage.order,
    createdAt: new Date(stage.createdAt),
    updatedAt: new Date(stage.updatedAt),
  };
}

function mapFunnel(row: FunnelApiResponse): Funnel {
  return {
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    clinicId: row.storeId,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    stages: row.stages.map(mapStage),
  };
}

function mapOpportunity(row: OpportunityApiResponse): Opportunity {
  return {
    id: row.id,
    funnelId: row.funnelId,
    stageId: row.stageId,
    clinicId: row.storeId,
    title: row.title,
    description: row.description,
    phone: row.phone,
    origin: row.origin,
    nextContact: toDate(row.nextContact),
    patientId: row.patientId,
    labelId: row.labelId,
    submissionId: row.submissionId,
    budgetId: row.budgetId,
    campaign: row.campaign,
    sortOrder: row.sortOrder ?? 0,
    isDeletable: row.isDeletable,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    lastInteraction: toDate(row.lastInteraction),
    patient: row.patient,
  };
}

function mapLabel(row: LabelApiResponse): Label {
  return {
    id: row.id,
    clinicId: row.storeId,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapHistory(row: HistoryApiResponse): HistoryEntry {
  return {
    id: row.id,
    actionType: row.actionType,
    userId: row.userId,
    userName: row.userName,
    userAvatar: row.userAvatar,
    content: row.content,
    metadata: row.metadata,
    isSystemAction: row.isSystemAction,
    systemName: row.systemName,
    createdAt: row.createdAt,
  };
}

function toIsoDate(value: Date | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

function buildOpportunitiesQuery(filters?: ListOpportunitiesFilters): string {
  const params = new URLSearchParams();
  params.set("page", "1");
  // Kanban carrega o funil inteiro; limite operacional (sem paginação por coluna ainda).
  params.set("perPage", "2000");
  if (filters?.funnelId) params.set("funnelId", filters.funnelId);
  if (filters?.stageId && filters.stageId !== "all") {
    params.set("stageId", filters.stageId);
  }
  if (filters?.patientId) params.set("patientId", filters.patientId);
  if (filters?.labelId && filters.labelId !== "all") {
    params.set("labelId", filters.labelId);
  }
  if (filters?.origin && filters.origin !== "all") {
    params.set("origin", filters.origin);
  }
  if (filters?.period) params.set("period", filters.period);
  if (filters?.period === "custom") {
    // yyyy-MM-dd: o backend expande para o dia civil inteiro (BRT).
    if (filters.startDate) {
      params.set("startDate", formatLocalDateString(filters.startDate));
    }
    if (filters.endDate) {
      params.set("endDate", formatLocalDateString(filters.endDate));
    }
  } else {
    if (filters?.startDate) {
      params.set("startDate", filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.set("endDate", filters.endDate.toISOString());
    }
  }
  if (filters?.nextContactDate) {
    params.set("nextContactDate", filters.nextContactDate.toISOString());
  }
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  return `/v1/opportunities?${params.toString()}`;
}

export const salesService = {
  listFunnels: async (
    storeId: string,
  ): Promise<{ funnels: Funnel[] }> => {
    const res = await clinicaFetch<{
      data: FunnelApiResponse[];
      meta: PaginatedMeta;
    }>(storeId, "/v1/funnels?page=1&perPage=50");
    return { funnels: res.data.map(mapFunnel) };
  },

  getFunnel: async (storeId: string, id: string): Promise<Funnel> => {
    const res = await clinicaFetch<{ data: FunnelApiResponse }>(
      storeId,
      `/v1/funnels/${id}`,
    );
    return mapFunnel(res.data);
  },

  createFunnel: async (
    storeId: string,
    data: CreateFunnelData,
  ): Promise<Funnel> => {
    const res = await clinicaFetch<{ data: FunnelApiResponse }>(
      storeId,
      "/v1/funnels",
      {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          stages: data.stages,
        }),
      },
    );
    return mapFunnel(res.data);
  },

  updateFunnel: async (
    storeId: string,
    id: string,
    data: UpdateFunnelData,
  ): Promise<Funnel> => {
    const res = await clinicaFetch<{ data: FunnelApiResponse }>(
      storeId,
      `/v1/funnels/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          stages: data.stages,
        }),
      },
    );
    return mapFunnel(res.data);
  },

  deleteFunnel: async (storeId: string, id: string): Promise<void> => {
    await clinicaFetch<void>(storeId, `/v1/funnels/${id}`, {
      method: "DELETE",
    });
  },

  ensureDefaultFunnels: async (
    storeId: string,
  ): Promise<{
    created: boolean;
    funnels: Array<{ id: string; name: string; isDefault: boolean }>;
  }> => {
    return clinicaFetch<{
      created: boolean;
      funnels: Array<{ id: string; name: string; isDefault: boolean }>;
    }>(storeId, "/v1/funnels/ensure-defaults", {
      method: "POST",
    });
  },

  listOpportunities: async (
    storeId: string,
    filters?: ListOpportunitiesFilters,
  ): Promise<Opportunity[]> => {
    const res = await clinicaFetch<{
      data: OpportunityApiResponse[];
      meta: PaginatedMeta;
    }>(storeId, buildOpportunitiesQuery(filters));
    if (res.meta.total > res.data.length) {
      console.warn(
        `[sales] oportunidades truncadas: total=${res.meta.total}, retornadas=${res.data.length}`,
      );
    }
    return res.data.map(mapOpportunity);
  },

  getOpportunity: async (
    storeId: string,
    id: string,
  ): Promise<Opportunity> => {
    const res = await clinicaFetch<{ data: OpportunityApiResponse }>(
      storeId,
      `/v1/opportunities/${id}`,
    );
    return mapOpportunity(res.data);
  },

  createOpportunity: async (
    storeId: string,
    data: CreateOpportunityData,
  ): Promise<Opportunity> => {
    const res = await clinicaFetch<{ data: OpportunityApiResponse }>(
      storeId,
      "/v1/opportunities",
      {
        method: "POST",
        body: JSON.stringify({
          funnelId: data.funnelId,
          stageId: data.stageId,
          title: data.title,
          description: data.description,
          phone: data.phone,
          origin: data.origin,
          nextContact: toIsoDate(data.nextContact),
          patientId: data.patientId,
          labelId: data.labelId,
        }),
      },
    );
    return mapOpportunity(res.data);
  },

  updateOpportunity: async (
    storeId: string,
    id: string,
    data: UpdateOpportunityData,
  ): Promise<Opportunity> => {
    const res = await clinicaFetch<{ data: OpportunityApiResponse }>(
      storeId,
      `/v1/opportunities/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          phone: data.phone,
          origin: data.origin,
          nextContact:
            data.nextContact === undefined
              ? undefined
              : data.nextContact === null
                ? null
                : toIsoDate(data.nextContact),
          patientId: data.patientId,
          labelId: data.labelId,
          stageId: data.stageId,
        }),
      },
    );
    return mapOpportunity(res.data);
  },

  moveOpportunity: async (
    storeId: string,
    id: string,
    stageId: string,
    sortOrder?: number,
  ): Promise<Opportunity> => {
    const res = await clinicaFetch<{ data: OpportunityApiResponse }>(
      storeId,
      `/v1/opportunities/${id}/move`,
      {
        method: "PATCH",
        body: JSON.stringify({
          stageId,
          ...(sortOrder !== undefined ? { sortOrder } : {}),
        }),
      },
    );
    return mapOpportunity(res.data);
  },

  reorderOpportunities: async (
    storeId: string,
    items: Array<{ id: string; stageId: string; sortOrder: number }>,
  ): Promise<void> => {
    await clinicaFetch<void>(storeId, "/v1/opportunities/reorder", {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
  },

  deleteOpportunity: async (storeId: string, id: string): Promise<void> => {
    await clinicaFetch<void>(storeId, `/v1/opportunities/${id}`, {
      method: "DELETE",
    });
  },

  addComment: async (
    storeId: string,
    opportunityId: string,
    content: string,
  ): Promise<HistoryEntry> => {
    const res = await clinicaFetch<{ data: HistoryApiResponse }>(
      storeId,
      `/v1/opportunities/${opportunityId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
    return mapHistory(res.data);
  },

  getHistory: async (
    storeId: string,
    opportunityId: string,
  ): Promise<HistoryEntry[]> => {
    const res = await clinicaFetch<{ data: HistoryApiResponse[] }>(
      storeId,
      `/v1/opportunities/${opportunityId}/history`,
    );
    return res.data.map(mapHistory);
  },
};

export const labelService = {
  listLabels: async (storeId: string): Promise<Label[]> => {
    const res = await clinicaFetch<{
      data: LabelApiResponse[];
      meta: PaginatedMeta;
    }>(storeId, "/v1/labels?page=1&perPage=100");
    return res.data.map(mapLabel);
  },

  createLabel: async (
    storeId: string,
    data: CreateLabelData,
  ): Promise<Label> => {
    const res = await clinicaFetch<{ data: LabelApiResponse }>(
      storeId,
      "/v1/labels",
      {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          color: data.color,
        }),
      },
    );
    return mapLabel(res.data);
  },

  updateLabel: async (
    storeId: string,
    id: string,
    data: UpdateLabelData,
  ): Promise<Label> => {
    const res = await clinicaFetch<{ data: LabelApiResponse }>(
      storeId,
      `/v1/labels/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          color: data.color,
        }),
      },
    );
    return mapLabel(res.data);
  },

  deleteLabel: async (storeId: string, id: string): Promise<void> => {
    await clinicaFetch<void>(storeId, `/v1/labels/${id}`, {
      method: "DELETE",
    });
  },
};
