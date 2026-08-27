import type {
  FiscalParameterListItem,
  FiscalParameterListTab,
  FiscalParameterTabCounts,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

export const FISCAL_PARAMETER_TAB_ORDER: FiscalParameterListTab[] = [
  "all",
  "pending",
];

export const FISCAL_PARAMETER_TAB_LABELS: Record<
  FiscalParameterListTab,
  string
> = {
  all: "Todos",
  pending: "Pendentes",
};

export function matchesTab(
  item: FiscalParameterListItem,
  tab: FiscalParameterListTab,
): boolean {
  if (tab === "pending") return !item.configured;
  return true;
}

export function computeTabCounts(
  items: FiscalParameterListItem[],
): FiscalParameterTabCounts {
  return {
    all: items.length,
    pending: items.filter((item) => !item.configured).length,
  };
}
