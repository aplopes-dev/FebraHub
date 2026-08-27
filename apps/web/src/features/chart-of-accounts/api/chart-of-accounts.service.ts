"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  ChartOfAccountListResponseDto,
  ChartOfAccountResponseDto,
  SaveChartOfAccountPayload,
} from "@/features/chart-of-accounts/api/chart-of-account.dto";
import { toChartOfAccount } from "@/features/chart-of-accounts/api/chart-of-account.mapper";
import type {
  ChartOfAccount,
  ChartOfAccountListParams,
  ChartOfAccountListResult,
} from "@/features/chart-of-accounts/types/chart-of-account";

export type ChartOfAccountOption = { id: string; name: string };

function buildListQuery(params: ChartOfAccountListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listChartOfAccounts(
  params: ChartOfAccountListParams,
): Promise<ChartOfAccountListResult> {
  const response = await apiFetch<ChartOfAccountListResponseDto>(
    `/v1/chart-of-accounts?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toChartOfAccount),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

/** Opções leves para `Select`/`Autocomplete` — só ativas, sem paginação/abas. */
export async function listChartOfAccountOptionsApi(): Promise<
  ChartOfAccountOption[]
> {
  const response = await apiFetch<ChartOfAccountListResponseDto>(
    "/v1/chart-of-accounts?perPage=100&tab=active",
  );
  return response.data.map((dto) => ({ id: dto.id, name: dto.name }));
}

export async function getChartOfAccountByIdApi(
  id: string,
): Promise<ChartOfAccount> {
  const response = await apiFetch<ChartOfAccountResponseDto>(
    `/v1/chart-of-accounts/${id}`,
  );
  return toChartOfAccount(response.data);
}

export async function createChartOfAccount(
  payload: SaveChartOfAccountPayload,
): Promise<ChartOfAccount> {
  const response = await apiFetch<ChartOfAccountResponseDto>(
    "/v1/chart-of-accounts",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toChartOfAccount(response.data);
}

export async function updateChartOfAccount(
  id: string,
  payload: SaveChartOfAccountPayload,
): Promise<ChartOfAccount> {
  const response = await apiFetch<ChartOfAccountResponseDto>(
    `/v1/chart-of-accounts/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toChartOfAccount(response.data);
}

export async function deleteChartOfAccount(id: string): Promise<void> {
  await apiFetch<void>(`/v1/chart-of-accounts/${id}`, {
    method: "DELETE",
  });
}

export async function restoreChartOfAccount(
  id: string,
): Promise<ChartOfAccount> {
  const response = await apiFetch<ChartOfAccountResponseDto>(
    `/v1/chart-of-accounts/${id}/restore`,
    { method: "POST" },
  );
  return toChartOfAccount(response.data);
}
