"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  ProductCategoryListResponseDto,
  ProductCategoryResponseDto,
  SaveProductCategoryPayload,
} from "@/features/categories/api/category.dto";
import { toCategoryListItem } from "@/features/categories/api/category.mapper";
import type {
  CategoryListItem,
  CategoryListParams,
  CategoryListResult,
} from "@/features/categories/types/category";

function buildListQuery(params: CategoryListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listCategories(
  params: CategoryListParams,
): Promise<CategoryListResult> {
  const response = await apiFetch<ProductCategoryListResponseDto>(
    `/v1/product-categories?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toCategoryListItem),
    meta: response.meta,
  };
}

export async function createCategory(
  payload: SaveProductCategoryPayload,
) {
  const response = await apiFetch<ProductCategoryResponseDto>(
    "/v1/product-categories",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return response.data;
}

export async function updateCategory(
  id: string,
  payload: SaveProductCategoryPayload,
) {
  const response = await apiFetch<ProductCategoryResponseDto>(
    `/v1/product-categories/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(
    `/v1/product-categories/${id}`, {
    method: "DELETE",
  });
}

export function createEmptyCategoryFormValues(): SaveProductCategoryPayload {
  return {
    name: "",
    active: true,
  };
}

export function categoryToFormValues(
  category: Pick<CategoryListItem, "name" | "active">,
): SaveProductCategoryPayload {
  return {
    name: category.name,
    active: category.active,
  };
}
