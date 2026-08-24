"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  SaveMovementCategoryPayload,
  MovementCategoryListResponseDto,
  MovementCategoryResponseDto,
} from "@/features/movement-categories/api/movement-category.dto";
import { toMovementCategory } from "@/features/movement-categories/api/movement-category.mapper";
import type {
  MovementCategory,
  MovementCategoryListParams,
  MovementCategoryListResult,
} from "@/features/movement-categories/types/movement-category";

function buildListQuery(params: MovementCategoryListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.type !== "all") query.set("type", params.type);
  return query.toString();
}

export async function listMovementCategoriesApi(
  params: MovementCategoryListParams,
): Promise<MovementCategoryListResult> {
  const response = await comercioFetch<MovementCategoryListResponseDto>(
    `/v1/movement-categories?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toMovementCategory),
    meta: response.meta,
  };
}

export async function getMovementCategoryByIdApi(
  id: string,
): Promise<MovementCategory> {
  const response = await comercioFetch<MovementCategoryResponseDto>(
    `/v1/movement-categories/${id}`,
  );
  return toMovementCategory(response.data);
}

export async function createMovementCategoryApi(
  payload: SaveMovementCategoryPayload,
): Promise<MovementCategory> {
  const response = await comercioFetch<MovementCategoryResponseDto>(
    "/v1/movement-categories",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return toMovementCategory(response.data);
}

export async function updateMovementCategoryApi(
  id: string,
  payload: SaveMovementCategoryPayload,
): Promise<MovementCategory> {
  const response = await comercioFetch<MovementCategoryResponseDto>(
    `/v1/movement-categories/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  return toMovementCategory(response.data);
}

export async function deleteMovementCategoryApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/movement-categories/${id}`, {
    method: "DELETE",
  });
}
