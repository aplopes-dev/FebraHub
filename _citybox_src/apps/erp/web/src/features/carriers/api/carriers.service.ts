"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  CarrierListResponseDto,
  CarrierResponseDto,
  SaveCarrierPayload,
} from "@/features/carriers/api/carrier.dto";
import { toCarrier } from "@/features/carriers/api/carrier.mapper";
import type {
  Carrier,
  CarrierListParams,
  CarrierListResult,
  CarrierOption,
} from "@/features/carriers/types/carrier";

/** Teto de `perPage` da API (`MAX_PER_PAGE`). */
const MAX_PER_PAGE = 100;

function buildListQuery(params: CarrierListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listCarriers(
  params: CarrierListParams,
): Promise<CarrierListResult> {
  const response = await comercioFetch<CarrierListResponseDto>(
    `/v1/carriers?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toCarrier),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

/**
 * Opções enxutas de transportadoras/entregadores ativos, para selects de
 * outras telas (transferências de estoque, compras).
 *
 * Percorre TODAS as páginas: `MAX_PER_PAGE` é teto da API, não "traz tudo".
 * Pedindo só a primeira página, a organização com mais de 100 cadastros
 * simplesmente não conseguia selecionar as transportadoras excedentes — o
 * item sumia do combo sem nenhum aviso.
 */
export async function listCarrierOptions(): Promise<CarrierOption[]> {
  const options: CarrierOption[] = [];
  let page = 1;

  while (true) {
    const response = await comercioFetch<CarrierListResponseDto>(
      `/v1/carriers?tab=active&page=${page}&perPage=${MAX_PER_PAGE}`,
    );
    options.push(
      ...response.data.map((dto) => ({ id: dto.id, name: dto.name })),
    );
    if (page >= response.meta.totalPages || response.data.length === 0) break;
    page += 1;
  }

  return options;
}

export async function getCarrierById(id: string): Promise<Carrier> {
  const response = await comercioFetch<CarrierResponseDto>(
    `/v1/carriers/${id}`,
  );
  return toCarrier(response.data);
}

export async function createCarrier(
  payload: SaveCarrierPayload,
): Promise<Carrier> {
  const response = await comercioFetch<CarrierResponseDto>("/v1/carriers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toCarrier(response.data);
}

export async function updateCarrier(
  id: string,
  payload: SaveCarrierPayload,
): Promise<Carrier> {
  const response = await comercioFetch<CarrierResponseDto>(
    `/v1/carriers/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toCarrier(response.data);
}

export async function deleteCarrier(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/carriers/${id}`, { method: "DELETE" });
}

export async function restoreCarrier(id: string): Promise<Carrier> {
  const response = await comercioFetch<CarrierResponseDto>(
    `/v1/carriers/${id}/restore`,
    { method: "POST" },
  );
  return toCarrier(response.data);
}
