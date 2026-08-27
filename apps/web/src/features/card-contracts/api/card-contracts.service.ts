"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CardContractListResponseDto,
  CardContractResponseDto,
  CardPaymentMethodListResponseDto,
  CardPaymentMethodResponseDto,
  SaveCardContractPayload,
  SaveCardPaymentMethodPayload,
} from "@/features/card-contracts/api/card-contract.dto";
import {
  toCardContract,
  toPaymentMethod,
} from "@/features/card-contracts/api/card-contract.mapper";
import type {
  CardContract,
  CardContractListParams,
  CardContractListResult,
  PaymentMethod,
} from "@/features/card-contracts/types/card-contract";

function buildListQuery(params: CardContractListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listCardContracts(
  params: CardContractListParams,
): Promise<CardContractListResult> {
  const response = await apiFetch<CardContractListResponseDto>(
    `/v1/card-contracts?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toCardContract),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export async function getCardContractById(
  id: string,
): Promise<CardContract> {
  const response = await apiFetch<CardContractResponseDto>(
    `/v1/card-contracts/${id}`,
  );
  return toCardContract(response.data);
}

export async function createCardContract(
  payload: SaveCardContractPayload,
): Promise<CardContract> {
  const response = await apiFetch<CardContractResponseDto>(
    "/v1/card-contracts",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toCardContract(response.data);
}

export async function updateCardContract(
  id: string,
  payload: SaveCardContractPayload,
): Promise<CardContract> {
  const response = await apiFetch<CardContractResponseDto>(
    `/v1/card-contracts/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toCardContract(response.data);
}

export async function deleteCardContract(id: string): Promise<void> {
  await apiFetch<void>(`/v1/card-contracts/${id}`, { method: "DELETE" });
}

export async function restoreCardContract(
  id: string,
): Promise<CardContract> {
  const response = await apiFetch<CardContractResponseDto>(
    `/v1/card-contracts/${id}/restore`,
    { method: "POST" },
  );
  return toCardContract(response.data);
}

export async function listPaymentMethods(
  contractId: string,
): Promise<PaymentMethod[]> {
  const response = await apiFetch<CardPaymentMethodListResponseDto>(
    `/v1/card-contracts/${contractId}/payment-methods`,
  );
  return response.data.map(toPaymentMethod);
}

export async function createPaymentMethod(
  contractId: string,
  payload: SaveCardPaymentMethodPayload,
): Promise<PaymentMethod> {
  const response = await apiFetch<CardPaymentMethodResponseDto>(
    `/v1/card-contracts/${contractId}/payment-methods`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toPaymentMethod(response.data);
}

export async function updatePaymentMethod(
  contractId: string,
  methodId: string,
  payload: SaveCardPaymentMethodPayload,
): Promise<PaymentMethod> {
  const response = await apiFetch<CardPaymentMethodResponseDto>(
    `/v1/card-contracts/${contractId}/payment-methods/${methodId}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toPaymentMethod(response.data);
}

export async function deletePaymentMethod(
  contractId: string,
  methodId: string,
): Promise<void> {
  await apiFetch<void>(
    `/v1/card-contracts/${contractId}/payment-methods/${methodId}`,
    { method: "DELETE" },
  );
}
