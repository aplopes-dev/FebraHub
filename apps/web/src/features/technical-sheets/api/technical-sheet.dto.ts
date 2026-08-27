import type { ProductionType } from "@/features/technical-sheets/types/technical-sheet";

export type TechnicalSheetListItemDto = {
  id: string;
  name: string;
  sku: string;
  /** Sempre `null` — object key do MinIO não é URL pública. */
  imageUrl: null;
  /** True quando há imagem no MinIO (`GET /v1/products/:id/image`). */
  hasImage: boolean;
  category: string;
  productionType: ProductionType | null;
  hasComposition: boolean;
};

export type TechnicalSheetListResponseDto = {
  data: TechnicalSheetListItemDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: {
    all: number;
    production: number;
  };
};

export type TechnicalSheetComponentDto = {
  id: string;
  componentProductId: string;
  name: string;
  unit: string;
  optional: boolean;
  quantity: string;
  unitCostCents: number;
  sortOrder: number;
};

export type TechnicalSheetOptionComponentDto = {
  id: string;
  variationOptionId: string;
  componentProductId: string;
  name: string;
  unit: string;
  optional: boolean;
  quantity: string;
  unitCostCents: number;
  sortOrder: number;
};

export type TechnicalSheetDetailDto = {
  productId: string;
  name: string;
  sku: string;
  /** Sempre `null` — object key do MinIO não é URL pública. */
  imageUrl: null;
  /** True quando há imagem no MinIO (`GET /v1/products/:id/image`). */
  hasImage: boolean;
  category: string;
  productionType: ProductionType;
  maxRemovableComponents: number;
  markupPercent: number;
  currentPriceCents: number;
  totalCostCents: number;
  hasSheet: boolean;
  components: TechnicalSheetComponentDto[];
  optionComponents: TechnicalSheetOptionComponentDto[];
};

export type TechnicalSheetDetailResponseDto = {
  data: TechnicalSheetDetailDto;
};

export type UpsertTechnicalSheetPayload = {
  productionType: ProductionType;
  maxRemovableComponents: number;
  markupPercent: number;
  components: Array<{
    id?: string;
    componentProductId: string;
    optional: boolean;
    quantity: number;
    sortOrder: number;
  }>;
  optionComponents: Array<{
    id?: string;
    variationOptionId: string;
    componentProductId: string;
    optional: boolean;
    quantity: number;
    sortOrder: number;
  }>;
  applyBasePriceCents?: number;
};
