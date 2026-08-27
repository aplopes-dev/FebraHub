"use client";

import {
  ApiError,
  apiFetch,
} from "@/lib/api/client";
import type {
  TechnicalSheetListParams,
  TechnicalSheetListResult,
  TechnicalSheetFormValues,
  VariationComposition,
} from "@/features/technical-sheets/types/technical-sheet";
import type {
  TechnicalSheetDetailDto,
  TechnicalSheetDetailResponseDto,
  TechnicalSheetListResponseDto,
} from "./technical-sheet.dto";
import {
  toTechnicalSheetFormValues,
  toTechnicalSheetListItem,
  toUpsertTechnicalSheetPayload,
} from "./technical-sheet.mapper";

function buildListQuery(params: TechnicalSheetListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  query.set("sort", params.sort);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.category.trim()) query.set("category", params.category.trim());
  if (params.filters.categories.length) {
    query.set("categories", params.filters.categories.join(","));
  }
  if (params.filters.productionTypes.length) {
    query.set("productionTypes", params.filters.productionTypes.join(","));
  }
  return query.toString();
}

export async function listTechnicalSheetsApi(
  params: TechnicalSheetListParams,
): Promise<TechnicalSheetListResult> {
  const response = await apiFetch<TechnicalSheetListResponseDto>(
    `/v1/technical-sheets?${buildListQuery(params)}`,
  );
  return {
    data: response.data.map(toTechnicalSheetListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export type TechnicalSheetDetail = {
  dto: TechnicalSheetDetailDto;
  item: ReturnType<typeof toTechnicalSheetListItem>;
};

export async function getTechnicalSheetByProductId(
  productId: string,
): Promise<TechnicalSheetDetail | null> {
  try {
    const response = await apiFetch<TechnicalSheetDetailResponseDto>(
      `/v1/technical-sheets/${productId}`,
    );
    return {
      dto: response.data,
      item: toTechnicalSheetListItem({
        id: response.data.productId,
        name: response.data.name,
        sku: response.data.sku,
        imageUrl: null,
        hasImage: response.data.hasImage,
        category: response.data.category,
        productionType: response.data.productionType,
        hasComposition:
          response.data.components.length > 0 ||
          response.data.optionComponents.length > 0,
      }),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function detailToFormValues(
  detail: TechnicalSheetDetail,
  variationStructure: VariationComposition[],
): TechnicalSheetFormValues {
  return toTechnicalSheetFormValues(detail.dto, variationStructure);
}

export async function upsertTechnicalSheet(
  productId: string,
  values: TechnicalSheetFormValues,
  options?: { applyBasePriceCents?: number },
): Promise<TechnicalSheetDetailDto> {
  const response = await apiFetch<TechnicalSheetDetailResponseDto>(
    `/v1/technical-sheets/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(toUpsertTechnicalSheetPayload(values, options)),
    },
  );
  return response.data;
}
