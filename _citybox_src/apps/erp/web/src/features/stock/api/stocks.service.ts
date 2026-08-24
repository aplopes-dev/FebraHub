"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  SaveStockPayload,
  StockListResponseDto,
  StockResponseDto,
} from "@/features/stock/api/stock.dto";
import { toStock } from "@/features/stock/api/stock.mapper";
import type {
  Stock,
  StockListParams,
  StockListResult,
} from "@/features/stock/types/stock";

function buildListQuery(params: StockListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listStocksApi(
  params: StockListParams,
): Promise<StockListResult> {
  const response = await comercioFetch<StockListResponseDto>(
    `/v1/stocks?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toStock),
    meta: response.meta,
  };
}

/** Teto de `perPage` da API (`MAX_PER_PAGE`) — não é "traz tudo". */
const MAX_PER_PAGE = 100;

/**
 * Todos os depósitos da organização, percorrendo as páginas.
 *
 * Para SELECTS (movimentação, transferência, compra, produção), que pediam
 * `page=1&perPage=100` e truncavam em silêncio: acima de 100 depósitos a opção
 * simplesmente não aparecia no combo. Para LISTAGEM em tela, continue usando
 * `listStocksApi` com paginação real.
 */
export async function listAllStocksApi(): Promise<Stock[]> {
  const stocks: Stock[] = [];
  let page = 1;

  while (true) {
    const response = await comercioFetch<StockListResponseDto>(
      `/v1/stocks?page=${page}&perPage=${MAX_PER_PAGE}`,
    );
    stocks.push(...response.data.map(toStock));
    if (page >= response.meta.totalPages || response.data.length === 0) break;
    page += 1;
  }

  return stocks;
}

export async function getStockByIdApi(id: string): Promise<Stock> {
  const response = await comercioFetch<StockResponseDto>(`/v1/stocks/${id}`);
  return toStock(response.data);
}

export async function createStockApi(
  payload: SaveStockPayload,
): Promise<Stock> {
  const response = await comercioFetch<StockResponseDto>("/v1/stocks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toStock(response.data);
}

export async function updateStockApi(
  id: string,
  payload: SaveStockPayload,
): Promise<Stock> {
  const response = await comercioFetch<StockResponseDto>(`/v1/stocks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return toStock(response.data);
}

export async function deleteStockApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/stocks/${id}`, { method: "DELETE" });
}
