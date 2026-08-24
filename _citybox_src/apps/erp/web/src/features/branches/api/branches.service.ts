"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  BranchListResponseDto,
  BranchResponseDto,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "@/features/branches/api/branch.dto";
import { toBranch } from "@/features/branches/api/branch.mapper";
import type {
  Branch,
  BranchListParams,
  BranchListResult,
} from "@/features/branches/types/branch";

function buildListQuery(params: BranchListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listBranchesApi(
  params: BranchListParams,
): Promise<BranchListResult> {
  const response = await comercioFetch<BranchListResponseDto>(
    `/v1/branches?${buildListQuery(params)}`,
  );

  return { data: response.data.map(toBranch), meta: response.meta };
}

export async function getBranchByIdApi(id: string): Promise<Branch> {
  const response = await comercioFetch<BranchResponseDto>(`/v1/branches/${id}`);
  return toBranch(response.data);
}

export async function createBranchApi(
  payload: CreateBranchPayload,
): Promise<Branch> {
  const response = await comercioFetch<BranchResponseDto>("/v1/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toBranch(response.data);
}

export async function updateBranchApi(
  id: string,
  payload: UpdateBranchPayload,
): Promise<Branch> {
  const response = await comercioFetch<BranchResponseDto>(`/v1/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return toBranch(response.data);
}

/** Soft-delete: a unidade sai das listagens, o histórico fiscal continua resolvendo. */
export async function deleteBranchApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/branches/${id}`, { method: "DELETE" });
}
