"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  FiscalDefaultTaxesDto,
  FiscalDefaultTaxesResponseDto,
  FiscalGroupDto,
  FiscalGroupListResponseDto,
  FiscalTaxType,
  UpsertFiscalDefaultTaxesPayload,
} from "./fiscal-default-taxes.dto";

/** Grupos fiscais da organização, opcionalmente por tributo (erp-api, escopo no header). */
export async function listFiscalGroupsApi(
  taxType?: FiscalTaxType,
): Promise<FiscalGroupDto[]> {
  const query = taxType ? `?taxType=${taxType}` : "";
  const res = await comercioFetch<FiscalGroupListResponseDto>(
    `/v1/fiscal-groups${query}`,
  );
  return res.data;
}

export async function getFiscalDefaultTaxesApi(): Promise<FiscalDefaultTaxesDto> {
  const res = await comercioFetch<FiscalDefaultTaxesResponseDto>(
    "/v1/fiscal-default-taxes",
  );
  return res.data;
}

export async function upsertFiscalDefaultTaxesApi(
  payload: UpsertFiscalDefaultTaxesPayload,
): Promise<FiscalDefaultTaxesDto> {
  const res = await comercioFetch<FiscalDefaultTaxesResponseDto>(
    "/v1/fiscal-default-taxes",
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return res.data;
}
