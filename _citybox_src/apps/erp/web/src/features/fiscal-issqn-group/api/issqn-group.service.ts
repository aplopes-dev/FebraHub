"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  IssqnGroupDto,
  IssqnGroupListResponseDto,
  IssqnGroupProductDto,
  IssqnGroupProductsResponseDto,
  IssqnGroupResponseDto,
  UpsertIssqnGroupPayload,
} from "./issqn-group.dto";

const BASE = "/v1/fiscal-issqn-groups";

export async function listIssqnGroupsApi(): Promise<IssqnGroupDto[]> {
  const res = await comercioFetch<IssqnGroupListResponseDto>(BASE);
  return res.data;
}

export async function getIssqnGroupApi(id: string): Promise<IssqnGroupDto> {
  const res = await comercioFetch<IssqnGroupResponseDto>(`${BASE}/${id}`);
  return res.data;
}

export async function listIssqnGroupProductsApi(
  id: string,
): Promise<IssqnGroupProductDto[]> {
  const res = await comercioFetch<IssqnGroupProductsResponseDto>(
    `${BASE}/${id}/products`,
  );
  return res.data;
}

export async function createIssqnGroupApi(
  payload: UpsertIssqnGroupPayload,
): Promise<IssqnGroupDto> {
  const res = await comercioFetch<IssqnGroupResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateIssqnGroupApi(
  id: string,
  payload: UpsertIssqnGroupPayload,
): Promise<IssqnGroupDto> {
  const res = await comercioFetch<IssqnGroupResponseDto>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}
