"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortableColumn = {
  getIsSorted: () => false | "asc" | "desc";
  toggleSorting: () => void;
};

type StockSortableHeaderProps = {
  label: string;
  column: SortableColumn;
  align?: "left" | "right";
};

export function StockSortableHeader({
  label,
  column,
  align = "left",
}: StockSortableHeaderProps) {
  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      className={
        align === "right"
          ? "inline-flex w-full items-center justify-end gap-2 font-medium text-foreground"
          : "inline-flex w-full items-center justify-start gap-2 font-medium text-foreground"
      }
      onClick={() => column.toggleSorting()}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-4" aria-hidden />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-4" aria-hidden />
      ) : (
        <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}
