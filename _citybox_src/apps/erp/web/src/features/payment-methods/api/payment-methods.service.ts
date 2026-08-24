"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PaymentMethodListResponseDto,
  PaymentMethodResponseDto,
  SavePaymentMethodPayload,
} from "@/features/payment-methods/api/payment-method.dto";
import { toPaymentMethod } from "@/features/payment-methods/api/payment-method.mapper";
import type { PaymentMethod } from "@/features/payment-methods/types/payment-method";

/**
 * Lista completa (ativas), sem paginação — a tela de Configurações não pagina
 * nem filtra (`FormSection` com duas listas empilhadas, ver AGENTS.md §4.5).
 * Sem endpoint `/options` dedicado no backend: mesmo padrão de
 * `listCostCenterOptionsApi` (`perPage` alto + `tab=active`).
 */
export async function listPaymentMethodsApi(): Promise<PaymentMethod[]> {
  const response = await comercioFetch<PaymentMethodListResponseDto>(
    "/v1/payment-methods?perPage=100&tab=active",
  );
  return response.data.map(toPaymentMethod);
}

export type PaymentMethodOption = { id: string; name: string };

/**
 * Opções leves para `Select`/`Autocomplete` — molde `listCostCenterOptionsApi`.
 * Consumida pelo select de Forma de pagamento em `financial-entries`/
 * `transfer-dialog` (spec `007-financeiro-ajustes-ui` US3/FR-006/FR-022).
 */
export async function listPaymentMethodOptionsApi(): Promise<
  PaymentMethodOption[]
> {
  const response = await comercioFetch<PaymentMethodListResponseDto>(
    "/v1/payment-methods?perPage=100&tab=active",
  );
  return response.data.map((dto) => ({ id: dto.id, name: dto.name }));
}

export async function createPaymentMethodApi(
  payload: SavePaymentMethodPayload,
): Promise<PaymentMethod> {
  const response = await comercioFetch<PaymentMethodResponseDto>(
    "/v1/payment-methods",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toPaymentMethod(response.data);
}

export async function updatePaymentMethodApi(
  id: string,
  payload: SavePaymentMethodPayload,
): Promise<PaymentMethod> {
  const response = await comercioFetch<PaymentMethodResponseDto>(
    `/v1/payment-methods/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toPaymentMethod(response.data);
}

export async function deletePaymentMethodApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/payment-methods/${id}`, {
    method: "DELETE",
  });
}
