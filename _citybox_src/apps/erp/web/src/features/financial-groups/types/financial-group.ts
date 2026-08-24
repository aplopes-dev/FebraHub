export type FinancialGroupType = "receita" | "despesa";

export type FinancialGroupTypeFilter = "all" | FinancialGroupType;

export type FinancialGroupListTab = "active" | "deleted";

export type FinancialGroupTabCounts = {
  active: number;
  deleted: number;
};

export type FinancialGroup = {
  id: string;
  name: string;
  type: FinancialGroupType;
  /** Seed / protegido — não pode ser excluído. */
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinancialGroupFormValues = {
  name: string;
  type: FinancialGroupType;
};

export type FinancialGroupListParams = {
  tab: FinancialGroupListTab;
  search: string;
  type: FinancialGroupTypeFilter;
  page: number;
  perPage: number;
};

export type FinancialGroupListResult = {
  data: FinancialGroup[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: FinancialGroupTabCounts;
};

export type FinancialGroupOption = {
  id: string;
  name: string;
  type: FinancialGroupType;
};

export type FinancialGroupRemovability = {
  removable: boolean;
  reason?: string;
};

export function canRemoveFinancialGroup(
  group: Pick<FinancialGroup, "isSystem">,
): FinancialGroupRemovability {
  if (group.isSystem) {
    return {
      removable: false,
      reason: "Grupos financeiros de sistema não podem ser excluídos.",
    };
  }
  return { removable: true };
}

export const FINANCIAL_GROUP_TYPE_LABELS: Record<FinancialGroupType, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

export const FINANCIAL_GROUP_TYPE_FILTER_LABELS: Record<
  FinancialGroupTypeFilter,
  string
> = {
  all: "Todos os tipos",
  receita: "Receita",
  despesa: "Despesa",
};

export const FINANCIAL_GROUP_TAB_LABELS: Record<FinancialGroupListTab, string> =
  {
    active: "Ativos",
    deleted: "Excluídos",
  };

export const FINANCIAL_GROUP_TAB_ORDER: FinancialGroupListTab[] = [
  "active",
  "deleted",
];
