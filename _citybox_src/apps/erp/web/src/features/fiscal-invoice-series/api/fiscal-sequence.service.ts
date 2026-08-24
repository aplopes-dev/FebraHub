"use client";

import { fiscalFetch } from "@/lib/api/fiscal-client";
import type {
  CreateFiscalSequencePayload,
  FiscalEnvironment,
  FiscalSequenceDto,
  FiscalSequenceListResponseDto,
  FiscalSequenceResponseDto,
} from "./fiscal-sequence.dto";

/** Séries do Emitente, filtradas por ambiente (spec erp/011, US1). */
export async function listFiscalSequencesApi(
  companyId: string,
  environment: FiscalEnvironment,
): Promise<FiscalSequenceDto[]> {
  const query = new URLSearchParams({ environment });
  const res = await fiscalFetch<FiscalSequenceListResponseDto>(
    `/v1/companies/${companyId}/sequences?${query}`,
  );
  return res.data;
}

/** Cria uma série. Resposta envelopada em `{ data }` — ler `res.data`. */
export async function createFiscalSequenceApi(
  companyId: string,
  payload: CreateFiscalSequencePayload,
): Promise<FiscalSequenceDto> {
  const res = await fiscalFetch<FiscalSequenceResponseDto>(
    `/v1/companies/${companyId}/sequences`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return res.data;
}

/** Ajusta o número atual (só aumento; a API bloqueia redução). */
export async function updateSequenceNumberApi(
  sequenceId: string,
  newNumber: number,
): Promise<FiscalSequenceDto> {
  const res = await fiscalFetch<FiscalSequenceResponseDto>(
    `/v1/sequences/${sequenceId}/number`,
    { method: "PATCH", body: JSON.stringify({ newNumber }) },
  );
  return res.data;
}

/** Ativa/desativa a série. */
export async function setSequenceActiveApi(
  sequenceId: string,
  active: boolean,
): Promise<FiscalSequenceDto> {
  const res = await fiscalFetch<FiscalSequenceResponseDto>(
    `/v1/sequences/${sequenceId}/active`,
    { method: "PATCH", body: JSON.stringify({ active }) },
  );
  return res.data;
}

/** Exclui a série (a API só permite com número atual 0). */
export async function deleteFiscalSequenceApi(
  sequenceId: string,
): Promise<void> {
  await fiscalFetch<void>(`/v1/sequences/${sequenceId}`, { method: "DELETE" });
}
