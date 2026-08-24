"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import { toFinancialEntryListItem } from "@/features/financial-entries/api/financial-entry.mapper";
import type { FinancialEntryListResponseDto } from "@/features/financial-entries/api/financial-entry.dto";
import type { FinancialEntryListResult } from "@/features/financial-entries/types/financial-entry";
import { buildFinancialStatementQuery, toFinancialStatementSummary } from "@/features/financial-statement/api/financial-statement.mapper";
import type { FinancialStatementSummaryDto } from "@/features/financial-statement/api/financial-statement.dto";
import type {
  FinancialStatementListParams,
  FinancialStatementSummary,
} from "@/features/financial-statement/types/financial-statement";

/**
 * Lista o extrato reaproveitando `GET /v1/financial-entries` (mesmo
 * endpoint/mapper de `financial-entries` — nenhum shape novo de item),
 * sempre na aba `active` (FR-012) e sem ordenação visível na tela.
 */
export async function listFinancialStatementApi(
  params: FinancialStatementListParams,
): Promise<FinancialEntryListResult> {
  const query = buildFinancialStatementQuery(params);
  query.set("tab", "active");
  query.set("sort", "due_date_desc");
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));

  const res = await comercioFetch<FinancialEntryListResponseDto>(
    `/v1/financial-entries?${query}`,
  );

  return {
    data: res.data.map(toFinancialEntryListItem),
    meta: res.meta,
    tabCounts: res.tabCounts,
  };
}

/** Cards de resumo — mesmos filtros da lista, `GET /v1/financial-entries/summary`. */
export async function getFinancialStatementSummaryApi(
  params: Pick<FinancialStatementListParams, "search" | "filters">,
): Promise<FinancialStatementSummary> {
  const query = buildFinancialStatementQuery(params);

  const res = await comercioFetch<{ data: FinancialStatementSummaryDto }>(
    `/v1/financial-entries/summary?${query}`,
  );

  return toFinancialStatementSummary(res.data);
}
