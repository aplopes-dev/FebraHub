import type {
  SalesContract,
  SalesContractListTab,
  SalesContractTabCounts,
} from "@/features/sales-contracts/types/sales-contract";

export const SALES_CONTRACT_TAB_ORDER: SalesContractListTab[] = [
  "active",
  "deleted",
];

export const SALES_CONTRACT_TAB_LABELS: Record<SalesContractListTab, string> = {
  active: "Ativos",
  deleted: "Excluídos",
};

export function matchesTab(
  contract: SalesContract,
  tab: SalesContractListTab,
): boolean {
  const isDeleted = Boolean(contract.deletedAt);
  if (tab === "deleted") return isDeleted;
  return !isDeleted;
}

export function computeTabCounts(
  contracts: readonly SalesContract[],
): SalesContractTabCounts {
  return {
    active: contracts.filter((c) => !c.deletedAt).length,
    deleted: contracts.filter((c) => Boolean(c.deletedAt)).length,
  };
}
