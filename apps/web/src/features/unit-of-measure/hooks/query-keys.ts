import type { UnitOfMeasureListParams } from "@/features/unit-of-measure/types/unit-of-measure";

export const unitOfMeasureKeys = {
  all: (scope: string) => ["api", "units-of-measure", scope] as const,
  lists: (scope: string) =>
    [...unitOfMeasureKeys.all(scope), "list"] as const,
  list: (scope: string, params: UnitOfMeasureListParams) =>
    [...unitOfMeasureKeys.lists(scope), params] as const,
  active: (scope: string) =>
    [...unitOfMeasureKeys.all(scope), "active"] as const,
};
