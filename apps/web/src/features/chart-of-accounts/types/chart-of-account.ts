import type { FinancialGroupType } from "@/features/financial-groups/types/financial-group";

export type ChartOfAccountListTab = "active" | "deleted";

export type ChartOfAccountTabCounts = {
  active: number;
  deleted: number;
};

export type ChartOfAccount = {
  id: string;
  name: string;
  financialGroupId: string;
  financialGroupName: string;
  financialGroupType: FinancialGroupType;
  availableForPdv: boolean;
  /** Seed / protegido — não pode ser excluído. */
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChartOfAccountFormValues = {
  name: string;
  financialGroupId: string;
  availableForPdv: boolean;
};

export type ChartOfAccountListParams = {
  tab: ChartOfAccountListTab;
  search: string;
  page: number;
  perPage: number;
};

export type ChartOfAccountListResult = {
  data: ChartOfAccount[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: ChartOfAccountTabCounts;
};

export type ChartOfAccountRemovability = {
  removable: boolean;
  reason?: string;
};

export function canRemoveChartOfAccount(
  account: Pick<ChartOfAccount, "isSystem">,
): ChartOfAccountRemovability {
  if (account.isSystem) {
    return {
      removable: false,
      reason: "Planos de contas de sistema não podem ser excluídos.",
    };
  }
  return { removable: true };
}

export const CHART_OF_ACCOUNT_TAB_LABELS: Record<
  ChartOfAccountListTab,
  string
> = {
  active: "Ativos",
  deleted: "Excluídos",
};

export const CHART_OF_ACCOUNT_TAB_ORDER: ChartOfAccountListTab[] = [
  "active",
  "deleted",
];
