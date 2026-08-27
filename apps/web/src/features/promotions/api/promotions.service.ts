"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionType,
} from "@/features/promotions/types/promotion";

export type PromotionDto = {
  id: string;
  name: string;
  description: string;
  type: PromotionType;
  startsAt: string;
  endsAt: string;
  rulesJson: Record<string, unknown>;
  branchIds: string[];
  deletedAt: string | null;
  createdAt: string;
};

type ListResponse = {
  data: PromotionDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
  tabCounts?: { active: number; deleted: number };
};

function toPromotion(dto: PromotionDto): Promotion {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    deletedAt: dto.deletedAt,
  };
}

export type SavePromotionInput = {
  name: string;
  type: PromotionType;
  startsAt: string;
  endsAt: string;
  description?: string;
  rulesJson?: Record<string, unknown>;
  branchIds?: string[];
};

export async function listPromotionsApi(
  params: PromotionListParams,
): Promise<PromotionListResult> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());

  const response = await apiFetch<ListResponse>(
    `/v1/promotions?${query.toString()}`,
  );

  return {
    data: response.data.map(toPromotion),
    meta: response.meta,
    tabCounts: response.tabCounts ?? {
      active: params.tab === "active" ? response.meta.total : 0,
      deleted: params.tab === "deleted" ? response.meta.total : 0,
    },
  };
}

export async function getPromotionByIdApi(
  id: string,
): Promise<PromotionDto | null> {
  try {
    return await apiFetch<PromotionDto>(`/v1/promotions/${id}`);
  } catch {
    return null;
  }
}

export async function createPromotionApi(
  input: SavePromotionInput,
): Promise<PromotionDto> {
  return apiFetch<PromotionDto>("/v1/promotions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePromotionApi(
  id: string,
  input: SavePromotionInput,
): Promise<PromotionDto> {
  return apiFetch<PromotionDto>(`/v1/promotions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deletePromotionApi(id: string): Promise<void> {
  await apiFetch<void>(`/v1/promotions/${id}`, { method: "DELETE" });
}

export async function restorePromotionApi(id: string): Promise<PromotionDto> {
  return apiFetch<PromotionDto>(`/v1/promotions/${id}/restore`, {
    method: "POST",
  });
}

export async function previewPromotionApi(input: {
  productIds: string[];
  quantities: number[];
}): Promise<{ discountCents: number }> {
  return apiFetch<{ discountCents: number }>("/v1/promotions/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
