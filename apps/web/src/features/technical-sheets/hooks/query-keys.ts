import type { TechnicalSheetListParams } from "@/features/technical-sheets/types/technical-sheet";

export const technicalSheetKeys = {
  all: (scope: string) => ["api", "technical-sheets", scope] as const,
  lists: (scope: string) =>
    [...technicalSheetKeys.all(scope), "list"] as const,
  list: (scope: string, params: TechnicalSheetListParams) =>
    [...technicalSheetKeys.lists(scope), params] as const,
  detail: (scope: string, productId: string) =>
    [...technicalSheetKeys.all(scope), "detail", productId] as const,
  supplyOptions: (scope: string) =>
    [...technicalSheetKeys.all(scope), "supply-options"] as const,
};
