"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  FinancialGroupListResponseDto,
  FinancialGroupResponseDto,
  SaveFinancialGroupPayload,
} from "@/features/financial-groups/api/financial-group.dto";
import {
  toFinancialGroup,
  toFinancialGroupOption,
} from "@/features/financial-groups/api/financial-group.mapper";
import type {
  FinancialGroup,
  FinancialGroupListParams,
  FinancialGroupListResult,
  FinancialGroupOption,
} from "@/features/financial-groups/types/financial-group";

const MAX_PER_PAGE = 100;

function buildListQuery(params: FinancialGroupListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.type !== "all") query.set("type", params.type);
  return query.toString();
}

export async function listFinancialGroups(
  params: FinancialGroupListParams,
): Promise<FinancialGroupListResult> {
  const response = await apiFetch<FinancialGroupListResponseDto>(
    `/v1/financial-groups?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toFinancialGroup),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

/** Opções ativas para selects (plano de contas, etc.). */
export async function listFinancialGroupOptions(): Promise<
  FinancialGroupOption[]
> {
  const response = await apiFetch<FinancialGroupListResponseDto>(
    `/v1/financial-groups?tab=active&page=1&perPage=${MAX_PER_PAGE}`,
  );
  return response.data.map(toFinancialGroupOption);
}

export async function getFinancialGroupByIdApi(
  id: string,
): Promise<FinancialGroup> {
  const response = await apiFetch<FinancialGroupResponseDto>(
    `/v1/financial-groups/${id}`,
  );
  return toFinancialGroup(response.data);
}

export async function createFinancialGroup(
  payload: SaveFinancialGroupPayload,
): Promise<FinancialGroup> {
  const response = await apiFetch<FinancialGroupResponseDto>(
    "/v1/financial-groups",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toFinancialGroup(response.data);
}

export async function updateFinancialGroup(
  id: string,
  payload: SaveFinancialGroupPayload,
): Promise<FinancialGroup> {
  const response = await apiFetch<FinancialGroupResponseDto>(
    `/v1/financial-groups/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toFinancialGroup(response.data);
}

export async function deleteFinancialGroup(id: string): Promise<void> {
  await apiFetch<void>(`/v1/financial-groups/${id}`, {
    method: "DELETE",
  });
}

export async function restoreFinancialGroup(
  id: string,
): Promise<FinancialGroup> {
  const response = await apiFetch<FinancialGroupResponseDto>(
    `/v1/financial-groups/${id}/restore`,
    { method: "POST" },
  );
  return toFinancialGroup(response.data);
}
