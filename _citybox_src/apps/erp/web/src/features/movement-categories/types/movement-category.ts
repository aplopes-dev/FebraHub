export type MovementCategoryType = "entrada" | "saida";

export type MovementCategoryTypeFilter = "all" | MovementCategoryType;

export type MovementCategory = {
  id: string;
  code: string;
  name: string;
  type: MovementCategoryType;
  unitIds: string[];
  /** Seed / protegida — não pode ser excluída; type imutável. */
  isSystem: boolean;
  systemKey: string | null;
};

export type MovementCategoryFormValues = {
  name: string;
  type: MovementCategoryType | "";
  unitIds: string[];
};

export type MovementCategoryListItem = MovementCategory;

export type MovementCategoryListParams = {
  search: string;
  type: MovementCategoryTypeFilter;
  page: number;
  perPage: number;
};

export type MovementCategoryListResult = {
  data: MovementCategoryListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

/** Opção enxuta para selects de outras features (ex.: movimentações). */
export type MovementCategoryOption = {
  id: string;
  name: string;
};

export type MovementCategoryRemovability = {
  removable: boolean;
  reason?: string;
};

export function canRemoveMovementCategory(
  category: Pick<MovementCategory, "isSystem">,
): MovementCategoryRemovability {
  if (category.isSystem) {
    return {
      removable: false,
      reason: "Categorias de sistema não podem ser excluídas.",
    };
  }
  return { removable: true };
}

export const MOVEMENT_CATEGORY_NAME_MAX = 60;

export const MOVEMENT_CATEGORY_TYPE_LABELS: Record<
  MovementCategoryType,
  string
> = {
  entrada: "Entrada",
  saida: "Saída",
};

export const MOVEMENT_CATEGORY_TYPE_FILTER_LABELS: Record<
  MovementCategoryTypeFilter,
  string
> = {
  all: "Todos os tipos",
  entrada: "Entrada",
  saida: "Saída",
};

export const MOVEMENT_CATEGORY_TYPE_ORDER: MovementCategoryType[] = [
  "entrada",
  "saida",
];
