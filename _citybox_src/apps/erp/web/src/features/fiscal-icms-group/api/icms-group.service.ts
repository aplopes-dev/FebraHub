"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  IcmsGroupDetailDto,
  IcmsGroupListItemDto,
  IcmsGroupListResponseDto,
  IcmsGroupProductDto,
  IcmsGroupProductsResponseDto,
  IcmsGroupResponseDto,
  UpsertIcmsGroupPayload,
} from "./icms-group.dto";

const BASE = "/v1/fiscal-icms-groups";

export async function listIcmsGroupsApi(): Promise<IcmsGroupListItemDto[]> {
  const res = await comercioFetch<IcmsGroupListResponseDto>(BASE);
  return res.data;
}

export async function getIcmsGroupApi(id: string): Promise<IcmsGroupDetailDto> {
  const res = await comercioFetch<IcmsGroupResponseDto>(`${BASE}/${id}`);
  return res.data;
}

export async function listIcmsGroupProductsApi(
  id: string,
): Promise<IcmsGroupProductDto[]> {
  const res = await comercioFetch<IcmsGroupProductsResponseDto>(
    `${BASE}/${id}/products`,
  );
  return res.data;
}

export async function createIcmsGroupApi(
  payload: UpsertIcmsGroupPayload,
): Promise<IcmsGroupDetailDto> {
  const res = await comercioFetch<IcmsGroupResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateIcmsGroupApi(
  id: string,
  payload: UpsertIcmsGroupPayload,
): Promise<IcmsGroupDetailDto> {
  const res = await comercioFetch<IcmsGroupResponseDto>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}
