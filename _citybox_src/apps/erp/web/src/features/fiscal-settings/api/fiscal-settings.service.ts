"use client";

import { fiscalFetch } from "@/lib/api/fiscal-client";
import type {
  FiscalCompanyDto,
  FiscalCompanyResponseDto,
  SetCscPayload,
  UpdateFiscalCompanyPayload,
} from "./fiscal-settings.dto";

/** Carrega o Emitente por id (traz `cscConfigured`, nunca o CSC). */
export async function getFiscalCompanyByIdApi(
  companyId: string,
): Promise<FiscalCompanyDto> {
  const res = await fiscalFetch<FiscalCompanyResponseDto>(
    `/v1/companies/${companyId}`,
  );
  return res.data;
}

/** Atualiza os dados fiscais do Emitente (um único Salvar). */
export async function updateFiscalCompanyApi(
  companyId: string,
  payload: UpdateFiscalCompanyPayload,
): Promise<FiscalCompanyDto> {
  const res = await fiscalFetch<FiscalCompanyResponseDto>(
    `/v1/companies/${companyId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return res.data;
}

/**
 * Grava o CSC (write-only). O token vive só no argumento e não é retornado —
 * a resposta traz apenas `cscConfigured`. Nunca colocar o token em queryKey.
 */
export async function setCscApi(
  companyId: string,
  payload: SetCscPayload,
): Promise<FiscalCompanyDto> {
  const res = await fiscalFetch<FiscalCompanyResponseDto>(
    `/v1/companies/${companyId}/csc`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return res.data;
}

/**
 * Remove o CSC (spec erp/024, Parte B) — volta a `cscConfigured: false`.
 * Bloqueada com 409 pelo proxy quando o PDV está em Modelo 65 (ver
 * `app/api/proxy/fiscal/[...path]/route.ts`, FR-009) — o erro chega aqui
 * como `FiscalApiError` normal, tratável por `businessErrorMessage`.
 */
export async function clearCscApi(companyId: string): Promise<FiscalCompanyDto> {
  const res = await fiscalFetch<FiscalCompanyResponseDto>(
    `/v1/companies/${companyId}/csc`,
    { method: "DELETE" },
  );
  return res.data;
}
