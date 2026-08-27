"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CustomerCategoryDto,
  CustomerCategoryListResponseDto,
  CustomerCategoryResponseDto,
  SaveCustomerCategoryPayload,
} from "@/features/customers/api/customer.dto";
import type {
  CustomerCategory,
  CustomerCategoryListParams,
  CustomerCategoryListResult,
} from "@/features/customer-categories/types/customer-category";

const MAX_PER_PAGE = 100;

function toCategory(dto: CustomerCategoryDto): CustomerCategory {
  return {
    id: dto.id,
    name: dto.name,
    discountPercentage: dto.discountPercentage,
    customerCount: dto.customerCount,
  };
}

function buildListQuery(params: CustomerCategoryListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listCustomerCategories(
  params: CustomerCategoryListParams,
): Promise<CustomerCategoryListResult> {
  const response = await apiFetch<CustomerCategoryListResponseDto>(
    `/v1/customer-categories?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toCategory),
    meta: response.meta,
  };
}

/** Todas as categorias (autocomplete / filtros). */
export async function listAllCustomerCategories(): Promise<CustomerCategory[]> {
  const response = await apiFetch<CustomerCategoryListResponseDto>(
    `/v1/customer-categories?page=1&perPage=${MAX_PER_PAGE}`,
  );
  return response.data.map(toCategory);
}

export async function createCustomerCategory(
  payload: SaveCustomerCategoryPayload,
): Promise<CustomerCategory> {
  const response = await apiFetch<CustomerCategoryResponseDto>(
    "/v1/customer-categories",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toCategory(response.data);
}

export async function updateCustomerCategory(
  id: string,
  payload: SaveCustomerCategoryPayload,
): Promise<CustomerCategory> {
  const response = await apiFetch<CustomerCategoryResponseDto>(
    `/v1/customer-categories/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toCategory(response.data);
}

export async function deleteCustomerCategory(id: string): Promise<void> {
  await apiFetch<void>(`/v1/customer-categories/${id}`, {
    method: "DELETE",
  });
}
