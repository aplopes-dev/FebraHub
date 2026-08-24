import type {
  TechnicalSheetListItem,
  TechnicalSheetListTab,
  TechnicalSheetTabCounts,
} from "@/features/technical-sheets/types/technical-sheet";

export function matchesTab(
  sheet: TechnicalSheetListItem,
  tab: TechnicalSheetListTab,
): boolean {
  switch (tab) {
    case "all":
      return true;
    case "production":
      return sheet.productionType === "productive_process";
    default:
      return true;
  }
}

export function computeTabCounts(
  sheets: TechnicalSheetListItem[],
): TechnicalSheetTabCounts {
  return {
    all: sheets.filter((sheet) => matchesTab(sheet, "all")).length,
    production: sheets.filter((sheet) => matchesTab(sheet, "production")).length,
  };
}

export const TECHNICAL_SHEET_TAB_LABELS: Record<TechnicalSheetListTab, string> = {
  all: "Todos",
  production: "Produção",
};

export const TECHNICAL_SHEET_TAB_ORDER: TechnicalSheetListTab[] = [
  "all",
  "production",
];
