export type CostCenterListTab = "active" | "deleted";

export type CostCenterTabCounts = {
  active: number;
  deleted: number;
};

export type CostCenter = {
  id: string;
  name: string;
  /** Seed / protegido — não pode ser excluído. */
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CostCenterFormValues = {
  name: string;
};

export type CostCenterListParams = {
  tab: CostCenterListTab;
  search: string;
  page: number;
  perPage: number;
};

export type CostCenterListResult = {
  data: CostCenter[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: CostCenterTabCounts;
};

export type CostCenterRemovability = {
  removable: boolean;
  reason?: string;
};

export function canRemoveCostCenter(
  costCenter: Pick<CostCenter, "isSystem">,
): CostCenterRemovability {
  if (costCenter.isSystem) {
    return {
      removable: false,
      reason: "Centros de custo de sistema não podem ser excluídos.",
    };
  }
  return { removable: true };
}

export const COST_CENTER_TAB_LABELS: Record<CostCenterListTab, string> = {
  active: "Ativos",
  deleted: "Excluídos",
};

export const COST_CENTER_TAB_ORDER: CostCenterListTab[] = [
  "active",
  "deleted",
];
