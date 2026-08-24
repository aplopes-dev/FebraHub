"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PisCofinsGroupDto,
  PisCofinsGroupListResponseDto,
  PisCofinsGroupProductDto,
  PisCofinsGroupProductsResponseDto,
  PisCofinsGroupResponseDto,
  UpsertPisCofinsGroupPayload,
} from "./pis-cofins-group.dto";

const BASE = "/v1/fiscal-pis-cofins-groups";

export async function listPisCofinsGroupsApi(): Promise<PisCofinsGroupDto[]> {
  const res = await comercioFetch<PisCofinsGroupListResponseDto>(BASE);
  return res.data;
}

export async function getPisCofinsGroupApi(
  id: string,
): Promise<PisCofinsGroupDto> {
  const res = await comercioFetch<PisCofinsGroupResponseDto>(`${BASE}/${id}`);
  return res.data;
}

export async function listPisCofinsGroupProductsApi(
  id: string,
): Promise<PisCofinsGroupProductDto[]> {
  const res = await comercioFetch<PisCofinsGroupProductsResponseDto>(
    `${BASE}/${id}/products`,
  );
  return res.data;
}

export async function createPisCofinsGroupApi(
  payload: UpsertPisCofinsGroupPayload,
): Promise<PisCofinsGroupDto> {
  const res = await comercioFetch<PisCofinsGroupResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updatePisCofinsGroupApi(
  id: string,
  payload: UpsertPisCofinsGroupPayload,
): Promise<PisCofinsGroupDto> {
  const res = await comercioFetch<PisCofinsGroupResponseDto>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}
