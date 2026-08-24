"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  IpiGroupDto,
  IpiGroupListResponseDto,
  IpiGroupProductDto,
  IpiGroupProductsResponseDto,
  IpiGroupResponseDto,
  UpsertIpiGroupPayload,
} from "./ipi-group.dto";

const BASE = "/v1/fiscal-ipi-groups";

export async function listIpiGroupsApi(): Promise<IpiGroupDto[]> {
  const res = await comercioFetch<IpiGroupListResponseDto>(BASE);
  return res.data;
}

export async function getIpiGroupApi(id: string): Promise<IpiGroupDto> {
  const res = await comercioFetch<IpiGroupResponseDto>(`${BASE}/${id}`);
  return res.data;
}

export async function listIpiGroupProductsApi(
  id: string,
): Promise<IpiGroupProductDto[]> {
  const res = await comercioFetch<IpiGroupProductsResponseDto>(
    `${BASE}/${id}/products`,
  );
  return res.data;
}

export async function createIpiGroupApi(
  payload: UpsertIpiGroupPayload,
): Promise<IpiGroupDto> {
  const res = await comercioFetch<IpiGroupResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateIpiGroupApi(
  id: string,
  payload: UpsertIpiGroupPayload,
): Promise<IpiGroupDto> {
  const res = await comercioFetch<IpiGroupResponseDto>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}
