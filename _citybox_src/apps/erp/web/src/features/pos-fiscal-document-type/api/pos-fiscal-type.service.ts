"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PosFiscalSettingsDto,
  PosFiscalSettingsResponseDto,
  UpsertPosFiscalSettingsPayload,
} from "./pos-fiscal-type.dto";

/** Config do tipo de NF do PDV (erp-api, escopada pela org ativa do header). */
export async function getPosFiscalSettingsApi(): Promise<PosFiscalSettingsDto> {
  const res = await comercioFetch<PosFiscalSettingsResponseDto>(
    "/v1/pos-fiscal-settings",
  );
  return res.data;
}

export async function upsertPosFiscalSettingsApi(
  payload: UpsertPosFiscalSettingsPayload,
): Promise<PosFiscalSettingsDto> {
  const res = await comercioFetch<PosFiscalSettingsResponseDto>(
    "/v1/pos-fiscal-settings",
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return res.data;
}
