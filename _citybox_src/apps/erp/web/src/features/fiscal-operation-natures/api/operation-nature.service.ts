"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  OperationNatureDto,
  OperationNatureListItemDto,
  OperationNatureListResponseDto,
  OperationNatureResponseDto,
  UpsertOperationNaturePayload,
} from "./operation-nature.dto";

const BASE = "/v1/operation-natures";

export async function listOperationNaturesApi(): Promise<
  OperationNatureListItemDto[]
> {
  const res = await comercioFetch<OperationNatureListResponseDto>(BASE);
  return res.data;
}

export async function getOperationNatureApi(
  id: string,
): Promise<OperationNatureDto> {
  const res = await comercioFetch<OperationNatureResponseDto>(`${BASE}/${id}`);
  return res.data;
}

export async function createOperationNatureApi(
  payload: UpsertOperationNaturePayload,
): Promise<OperationNatureDto> {
  const res = await comercioFetch<OperationNatureResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateOperationNatureApi(
  id: string,
  payload: UpsertOperationNaturePayload,
): Promise<OperationNatureDto> {
  const res = await comercioFetch<OperationNatureResponseDto>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteOperationNatureApi(id: string): Promise<void> {
  await comercioFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
