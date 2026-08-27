"use client";

import {
  ApiError,
  apiFetch,
} from "@/lib/api/client";
import type {
  FiscalParameterListParams,
  FiscalParameterListResult,
  FiscalParametersFormValues,
} from "@/features/fiscal-parameters/types/fiscal-parameters";
import type {
  FiscalParameterDetailDto,
  FiscalParameterDetailResponseDto,
  FiscalParameterListResponseDto,
} from "./fiscal-parameters.dto";
import {
  toFiscalParameterListItem,
  toFiscalParametersFormValues,
  toUpsertFiscalParametersPayload,
} from "./fiscal-parameters.mapper";

function buildListQuery(params: FiscalParameterListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  query.set("sort", params.sort);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.category.trim()) query.set("category", params.category.trim());
  if (params.filters.statuses.length) {
    query.set("statuses", params.filters.statuses.join(","));
  }
  if (params.filters.categories.length) {
    query.set("categories", params.filters.categories.join(","));
  }
  return query.toString();
}

export async function listFiscalParameters(
  params: FiscalParameterListParams,
): Promise<FiscalParameterListResult> {
  const response = await apiFetch<FiscalParameterListResponseDto>(
    `/v1/fiscal-parameters?${buildListQuery(params)}`,
  );
  return {
    data: response.data.map(toFiscalParameterListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export type FiscalParameterDetail = {
  item: ReturnType<typeof toFiscalParameterListItem>;
  formValues: FiscalParametersFormValues;
};

export async function getFiscalParametersByProductId(
  productId: string,
): Promise<FiscalParameterDetail | null> {
  try {
    const response = await apiFetch<FiscalParameterDetailResponseDto>(
      `/v1/fiscal-parameters/${productId}`,
    );
    return {
      item: toFiscalParameterListItem({
        id: response.data.id,
        name: response.data.name,
        sku: response.data.sku,
        imageUrl: null,
        hasImage: response.data.hasImage,
        category: response.data.category,
        configured: response.data.configured,
      }),
      formValues: toFiscalParametersFormValues(response.data),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertFiscalParameters(
  productId: string,
  values: FiscalParametersFormValues,
): Promise<FiscalParameterDetailDto> {
  const response = await apiFetch<{
    data: {
      productId: string;
      configured: boolean;
      info: FiscalParameterDetailDto["info"];
      group: FiscalParameterDetailDto["group"];
      units: FiscalParameterDetailDto["units"];
    };
  }>(`/v1/fiscal-parameters/${productId}`, {
    method: "PUT",
    body: JSON.stringify(toUpsertFiscalParametersPayload(values)),
  });

  return {
    id: response.data.productId,
    name: "",
    sku: "",
    imageUrl: null,
    hasImage: false,
    category: "",
    configured: response.data.configured,
    info: response.data.info,
    group: response.data.group,
    units: response.data.units,
  };
}
