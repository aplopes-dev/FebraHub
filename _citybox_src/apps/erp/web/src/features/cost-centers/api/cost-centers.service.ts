"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  CostCenterListResponseDto,
  CostCenterResponseDto,
  SaveCostCenterPayload,
} from "@/features/cost-centers/api/cost-center.dto";
import { toCostCenter } from "@/features/cost-centers/api/cost-center.mapper";
import type {
  CostCenter,
  CostCenterListParams,
  CostCenterListResult,
} from "@/features/cost-centers/types/cost-center";

export type CostCenterOption = { id: string; name: string };

function buildListQuery(params: CostCenterListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listCostCenters(
  params: CostCenterListParams,
): Promise<CostCenterListResult> {
  const response = await comercioFetch<CostCenterListResponseDto>(
    `/v1/cost-centers?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toCostCenter),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

/** Opções leves para `Select`/`Autocomplete` — só ativas, sem paginação/abas. */
export async function listCostCenterOptionsApi(): Promise<CostCenterOption[]> {
  const response = await comercioFetch<CostCenterListResponseDto>(
    "/v1/cost-centers?perPage=100&tab=active",
  );
  return response.data.map((dto) => ({ id: dto.id, name: dto.name }));
}

export async function getCostCenterById(id: string): Promise<CostCenter> {
  const response = await comercioFetch<CostCenterResponseDto>(
    `/v1/cost-centers/${id}`,
  );
  return toCostCenter(response.data);
}

export async function createCostCenter(
  payload: SaveCostCenterPayload,
): Promise<CostCenter> {
  const response = await comercioFetch<CostCenterResponseDto>(
    "/v1/cost-centers",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toCostCenter(response.data);
}

export async function updateCostCenter(
  id: string,
  payload: SaveCostCenterPayload,
): Promise<CostCenter> {
  const response = await comercioFetch<CostCenterResponseDto>(
    `/v1/cost-centers/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toCostCenter(response.data);
}

export async function deleteCostCenter(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/cost-centers/${id}`, { method: "DELETE" });
}

export async function restoreCostCenter(id: string): Promise<CostCenter> {
  const response = await comercioFetch<CostCenterResponseDto>(
    `/v1/cost-centers/${id}/restore`,
    { method: "POST" },
  );
  return toCostCenter(response.data);
}
