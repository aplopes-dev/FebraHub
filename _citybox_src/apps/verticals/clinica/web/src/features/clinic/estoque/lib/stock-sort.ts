export type StockProductsSortColumn =
  | "name"
  | "category"
  | "sku"
  | "supplier"
  | "quantity"
  | "status"
  | "activeValue";

export type StockProductsSortDirection = "asc" | "desc";

export type StockProductsSort = {
  columnId: StockProductsSortColumn;
  direction: StockProductsSortDirection;
} | null;

export type StockProductsApiSortBy =
  | "name"
  | "category"
  | "sku"
  | "supplier"
  | "quantity"
  | "status"
  | "activeValue";

export function getNextStockProductsSort(
  current: StockProductsSort,
  columnId: StockProductsSortColumn,
): StockProductsSort {
  if (current?.columnId === columnId) {
    return {
      columnId,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }
  return { columnId, direction: "asc" };
}

export function toStockProductsApiSort(sort: StockProductsSort): {
  sortBy?: StockProductsApiSortBy;
  sortOrder?: StockProductsSortDirection;
} {
  if (!sort) return {};
  return { sortBy: sort.columnId, sortOrder: sort.direction };
}

export type WithdrawalSortColumn =
  | "product"
  | "quantity"
  | "withdrawnBy"
  | "authorizedBy"
  | "date";

export type WithdrawalSortDirection = "asc" | "desc";

export type WithdrawalSort = {
  columnId: WithdrawalSortColumn;
  direction: WithdrawalSortDirection;
} | null;

export type WithdrawalApiSortBy =
  | "product"
  | "quantity"
  | "withdrawnBy"
  | "authorizedBy"
  | "date";

export function getNextWithdrawalSort(
  current: WithdrawalSort,
  columnId: WithdrawalSortColumn,
): WithdrawalSort {
  if (current?.columnId === columnId) {
    return {
      columnId,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }
  return { columnId, direction: "asc" };
}

export function toWithdrawalApiSort(sort: WithdrawalSort): {
  sortBy?: WithdrawalApiSortBy;
  sortOrder?: WithdrawalSortDirection;
} {
  if (!sort) return {};
  return { sortBy: sort.columnId, sortOrder: sort.direction };
}
