"use client";

import { ApiError, apiFetch, apiUpload } from "@/lib/api/client";
import type {
  BranchListResponseDto,
  BranchResponseDto,
  CreateBranchPayload,
  OrganizationStructureResponseDto,
  UpdateBranchPayload,
} from "@/features/branches/api/branch.dto";
import { toBranch } from "@/features/branches/api/branch.mapper";
import type {
  Branch,
  BranchListParams,
  BranchListResult,
  OrganizationStructure,
} from "@/features/branches/types/branch";

function assertData<T>(data: T | undefined, message: string): T {
  if (data === undefined) {
    throw new ApiError(500, message);
  }
  return data;
}

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
  const response = await apiFetch<BranchListResponseDto>(
    `/v1/branches?${buildListQuery(params)}`,
  );

  const data = response.data ?? [];
  const meta = response.meta ?? {
    page: params.page,
    perPage: params.perPage,
    total: data.length,
    totalPages: data.length === 0 ? 0 : 1,
  };

  return { data: data.map(toBranch), meta };
}

export async function getBranchByIdApi(id: string): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>(`/v1/branches/${id}`);
  return toBranch(assertData(response.data, "Loja não encontrada."));
}

export async function getMatrixByIdApi(id: string): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>(`/v1/matrices/${id}`);
  return toBranch(assertData(response.data, "Empresa matriz não encontrada."));
}

export async function getOrganizationStructureApi(): Promise<OrganizationStructure> {
  const response = await apiFetch<OrganizationStructureResponseDto>(
    "/v1/groups/current/structure",
  );
  const data = assertData(
    response.data,
    "Não foi possível carregar a estrutura organizacional.",
  );

  const storesByMatrix: OrganizationStructure["storesByMatrix"] = {};
  for (const [matrixId, stores] of Object.entries(data.storesByMatrix)) {
    storesByMatrix[matrixId] = stores.map(toBranch);
  }

  return {
    groupName: data.groupName,
    matrices: data.matrices.map(toBranch),
    storesByMatrix,
  };
}

export async function createMatrixApi(
  payload: CreateBranchPayload,
): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>("/v1/matrices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toBranch(assertData(response.data, "Não foi possível criar a matriz."));
}

export async function createBranchApi(
  payload: CreateBranchPayload,
): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>("/v1/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toBranch(assertData(response.data, "Não foi possível criar a loja."));
}

export async function updateMatrixApi(
  id: string,
  payload: UpdateBranchPayload,
): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>(`/v1/matrices/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return toBranch(assertData(response.data, "Não foi possível salvar a matriz."));
}

export async function updateBranchApi(
  id: string,
  payload: UpdateBranchPayload,
): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>(`/v1/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return toBranch(assertData(response.data, "Não foi possível salvar a loja."));
}

export async function deleteMatrixApi(id: string): Promise<void> {
  await apiFetch<void>(`/v1/matrices/${id}`, { method: "DELETE" });
}

/** Soft-delete: a loja sai das listagens, o histórico fiscal continua resolvendo. */
export async function deleteBranchApi(id: string): Promise<void> {
  await apiFetch<void>(`/v1/branches/${id}`, { method: "DELETE" });
}

export async function uploadMatrixLogoApi(
  id: string,
  file: File,
): Promise<Branch> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<BranchResponseDto>(
    `/v1/matrices/${id}/logo`,
    formData,
  );
  return toBranch(assertData(response.data, "Não foi possível enviar o logotipo."));
}

export async function deleteMatrixLogoApi(id: string): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>(
    `/v1/matrices/${id}/logo`,
    { method: "DELETE" },
  );
  return toBranch(assertData(response.data, "Não foi possível remover o logotipo."));
}

export async function uploadBranchLogoApi(
  id: string,
  file: File,
): Promise<Branch> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<BranchResponseDto>(
    `/v1/branches/${id}/logo`,
    formData,
  );
  return toBranch(assertData(response.data, "Não foi possível enviar o logotipo."));
}

export async function deleteBranchLogoApi(id: string): Promise<Branch> {
  const response = await apiFetch<BranchResponseDto>(
    `/v1/branches/${id}/logo`,
    { method: "DELETE" },
  );
  return toBranch(assertData(response.data, "Não foi possível remover o logotipo."));
}
