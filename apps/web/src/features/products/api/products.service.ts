"use client";

import {
  ApiError,
  apiFetch,
  apiUpload,
} from "@/lib/api/client";
import { applyScopeHeaders } from "@/lib/api/active-scope";
import type {
  ProductListParams,
  ProductListResult,
} from "@/features/products/types/product";
import { createEmptyProductFilters } from "@/features/products/lib/product-filters";
import type {
  ProductCategoryDto,
  ProductDto,
  ProductListResponseDto,
  ProductResponseDto,
  SaveProductPayload,
  UnitOfMeasureDto,
} from "./product.dto";
import { buildCategoryNameIndex, toProduct } from "./product.mapper";
import { productImageProxyUrl } from "./product-image-url";

export { productImageProxyUrl };

const API_PROXY = "/api/proxy/core";
const PRODUCT_IMPORT_TEMPLATE_FILENAME = "produtos-import-template.xlsx";

export type ProductImportResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

function buildListQuery(params: ProductListParams & { trackStock?: boolean }): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  query.set("sort", params.sort);
  if (params.search.trim()) query.set("search", params.search.trim());

  const { types, variants, categories, channels } = params.filters;
  if (types.length) query.set("types", types.join(","));
  if (variants !== "all") query.set("variants", variants);
  if (categories.length) query.set("categories", categories.join(","));
  if (params.trackStock) query.set("trackStock", "true");
  if (params.filters.stock !== "all") query.set("stock", params.filters.stock);
  if (channels.includes("erp") && !channels.includes("pdv")) {
    query.set("availableOnErp", "true");
  } else if (channels.includes("pdv") && !channels.includes("erp")) {
    query.set("availableOnPdv", "true");
  } else if (channels.includes("erp") && channels.includes("pdv")) {
    // Ambos marcados: produtos disponíveis em pelo menos um — API filtra AND
    // se enviarmos os dois; preferimos ERP∧PDV (mais restritivo) só quando
    // o operador marca os dois canais.
    query.set("availableOnErp", "true");
    query.set("availableOnPdv", "true");
  }

  return query.toString();
}

export async function listProducts(
  params: ProductListParams,
): Promise<ProductListResult> {
  // As categorias vêm junto porque a listagem exibe o NOME e a API devolve o id.
  const [response, categories] = await Promise.all([
    apiFetch<ProductListResponseDto>(
    `/v1/products?${buildListQuery(params)}`,
    ),
    listProductCategories(),
  ]);

  const categoryNames = buildCategoryNameIndex(categories);

  return {
    data: response.data.map((dto) => toProduct(dto, categoryNames)),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

const CATALOG_ALL_PARAMS: ProductListParams = {
  tab: "all",
  search: "",
  filters: createEmptyProductFilters(),
  sort: "name_asc",
  page: 1,
  perPage: 100,
};

/** Carrega todos os produtos do catálogo (paginação interna) para features derivadas. */
export async function listAllProducts(options?: {
  trackStock?: boolean;
  tab?: ProductListParams["tab"];
}): Promise<ProductListResult["data"]> {
  const categories = await listProductCategories();
  const categoryNames = buildCategoryNameIndex(categories);
  const all: ProductListResult["data"] = [];
  let page = 1;

  while (true) {
    const response = await apiFetch<ProductListResponseDto>(
      `/v1/products?${buildListQuery({
        ...CATALOG_ALL_PARAMS,
        tab: options?.tab ?? "all",
        page,
        trackStock: options?.trackStock,
      })}`,
    );
    all.push(...response.data.map((dto) => toProduct(dto, categoryNames)));
    if (page >= response.meta.totalPages) break;
    page += 1;
  }

  return all;
}

export async function getProductById(
  id: string,
): Promise<ProductDto> {
  const response = await apiFetch<ProductResponseDto>(
    `/v1/products/${id}`,
  );
  return response.data;
}

export async function createProduct(
  payload: SaveProductPayload,
): Promise<ProductDto> {
  const response = await apiFetch<ProductResponseDto>(
    "/v1/products",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return response.data;
}

export async function updateProduct(
  id: string,
  payload: SaveProductPayload,
): Promise<ProductDto> {
  const response = await apiFetch<ProductResponseDto>(
    `/v1/products/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return response.data;
}

export async function deleteProduct(
  id: string,
): Promise<void> {
  await apiFetch<void>(
    `/v1/products/${id}`, {
    method: "DELETE",
  });
}

export async function restoreProduct(
  id: string,
): Promise<ProductDto> {
  const response = await apiFetch<ProductResponseDto>(
    `/v1/products/${id}/restore`,
    { method: "POST" },
  );
  return response.data;
}

export async function duplicateProduct(id: string): Promise<ProductDto> {
  const response = await apiFetch<ProductResponseDto>(
    `/v1/products/${id}/duplicate`,
    { method: "POST" },
  );
  return response.data;
}

export async function bulkDeleteProducts(
  ids: string[],
): Promise<number> {
  const response = await apiFetch<{ data: { affected: number } }>(
    "/v1/products/bulk-delete",
    { method: "POST", body: JSON.stringify({ ids }) },
  );
  return response.data.affected;
}

export async function downloadProductImportTemplateFromApi(): Promise<void> {
  const headers = new Headers();
  applyScopeHeaders(headers);
  const response = await fetch(
    `${API_PROXY}/v1/products/import/template`,
    { headers },
  );

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await extractDownloadErrorMessage(response),
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = PRODUCT_IMPORT_TEMPLATE_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importProducts(file: File): Promise<ProductImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<{ data: ProductImportResult }>(
    "/v1/products/import",
    formData,
  );
  return response.data;
}

async function extractDownloadErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: { message?: string } | string;
      message?: string | string[];
    };
    if (typeof data.error === "string") return data.error;
    if (data.error?.message) return data.error.message;
    if (Array.isArray(data.message)) return data.message.join("; ");
    if (typeof data.message === "string") return data.message;
  } catch {
    // Resposta binária ou vazia: usa uma mensagem segura para a interface.
  }
  return `Erro ao baixar o modelo (${response.status})`;
}

export async function listProductCategories(
): Promise<ProductCategoryDto[]> {
  const response = await apiFetch<{ data: ProductCategoryDto[] }>(
    "/v1/product-categories?active=true",
  );
  return response.data;
}

export async function listUnitsOfMeasure(
): Promise<UnitOfMeasureDto[]> {
  const response = await apiFetch<{ data: UnitOfMeasureDto[] }>(
    "/v1/units-of-measure?active=true",
  );
  return response.data;
}

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<ProductDto> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<ProductResponseDto>(
    `/v1/products/${productId}/image`,
    formData,
  );
  return response.data;
}

export async function deleteProductImage(
  productId: string,
): Promise<ProductDto> {
  const response = await apiFetch<ProductResponseDto>(
    `/v1/products/${productId}/image`,
    { method: "DELETE" },
  );
  return response.data;
}
