"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { comercioFetch } from "@/lib/api/comercio-client";
import { listActiveUnitsOfMeasure } from "@/features/unit-of-measure/api/units-of-measure.service";
import type {
  ProductDto,
  ProductListResponseDto,
} from "@/features/products/api/product.dto";
import {
  getTechnicalSheetByProductId,
  listTechnicalSheetsApi,
} from "@/features/technical-sheets/api/technical-sheets.service";
import { technicalSheetKeys } from "@/features/technical-sheets/hooks/query-keys";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type { TechnicalSheetListParams } from "@/features/technical-sheets/types/technical-sheet";

export function useTechnicalSheetsListQuery(params: TechnicalSheetListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: technicalSheetKeys.list(scope, params),
    queryFn: () => listTechnicalSheetsApi(params),
    enabled: ready,
  });
}

export function useTechnicalSheetDetailQuery(productId: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: technicalSheetKeys.detail(scope, productId),
    queryFn: () => getTechnicalSheetByProductId(productId),
    enabled: ready && Boolean(productId),
    // Preço atual é lido do Product; refetch ao remontar evita valor stale.
    refetchOnMount: "always",
  });
}

async function listAllSupplyDtos(): Promise<ProductDto[]> {
  const all: ProductDto[] = [];
  let page = 1;
  while (true) {
    const response = await comercioFetch<ProductListResponseDto>(
      `/v1/products?page=${page}&perPage=100&tab=supplies&sort=name_asc`,
    );
    all.push(...response.data);
    if (page >= response.meta.totalPages) break;
    page += 1;
  }
  return all;
}

export function useSupplyComponentOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: technicalSheetKeys.supplyOptions(scope),
    queryFn: async (): Promise<CompositionComponentOption[]> => {
      const [supplies, units] = await Promise.all([
        listAllSupplyDtos(),
        listActiveUnitsOfMeasure(),
      ]);
      const unitById = new Map(
        units.map((unit) => [unit.id, unit.abbreviation]),
      );
      return supplies.map((product) => ({
        id: product.id,
        name: product.name,
        unit: product.unitOfMeasureId
          ? (unitById.get(product.unitOfMeasureId) ?? "un")
          : "un",
        unitCost: product.basePriceCents / 100,
      }));
    },
    enabled: ready,
    staleTime: 60_000,
  });
}
