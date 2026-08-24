import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  CreateFiscalAdditionalInfoPayload,
  FiscalAdditionalInfo,
  FiscalAdditionalInfoCounts,
  FiscalAdditionalInfoCountsResponseDto,
  FiscalAdditionalInfoListResponseDto,
  FiscalAdditionalInfoResponseDto,
  UpdateFiscalAdditionalInfoPayload,
} from "@/features/fiscal-additional-info/api/fiscal-additional-info.dto";
import type { FiscalDocumentType } from "@/features/fiscal-additional-info/lib/document-type-options";

const BASE = "/v1/fiscal-additional-infos";

export async function listFiscalAdditionalInfosApi(
  documentType: FiscalDocumentType,
): Promise<FiscalAdditionalInfo[]> {
  const response = await comercioFetch<FiscalAdditionalInfoListResponseDto>(
    `${BASE}?documentType=${documentType}`,
  );
  return response.data;
}

/** spec erp/023, N7 — contagem por tipo de documento (card do hub de Padrões fiscais). */
export async function countFiscalAdditionalInfosApi(): Promise<FiscalAdditionalInfoCounts> {
  const response = await comercioFetch<FiscalAdditionalInfoCountsResponseDto>(
    `${BASE}/count`,
  );
  return response.data;
}

export async function createFiscalAdditionalInfoApi(
  payload: CreateFiscalAdditionalInfoPayload,
): Promise<FiscalAdditionalInfo> {
  const response = await comercioFetch<FiscalAdditionalInfoResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateFiscalAdditionalInfoApi(
  id: string,
  payload: UpdateFiscalAdditionalInfoPayload,
): Promise<FiscalAdditionalInfo> {
  const response = await comercioFetch<FiscalAdditionalInfoResponseDto>(
    `${BASE}/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return response.data;
}

export async function deleteFiscalAdditionalInfoApi(id: string): Promise<void> {
  await comercioFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
