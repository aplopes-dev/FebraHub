"use client";

import type { ColumnDef } from "@citybox/ui/organisms";
import Image from "next/image";

import { cn } from "@citybox/ui";
import { Badge } from "@citybox/ui/atoms";

import type { StockProductsSort, StockProductsSortColumn } from "../../lib/stock-sort";
import type { StockProduct } from "../../types";
import { STATUS_LABELS, STATUS_COLORS } from "../../types";
import { StockSortableHeader } from "../stock-sortable-header";
import { CellAction } from "./cell-action";

export interface StockTableActions {
  onEdit?: (product: StockProduct) => void;
  onWithdraw?: (product: StockProduct) => void;
  onViewHistory?: (product: StockProduct) => void;
}

export interface StockTableSortProps {
  sort: StockProductsSort;
  onSortChange: (columnId: StockProductsSortColumn) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function sortableColumn(
  sort: StockProductsSort,
  onSortChange: (columnId: StockProductsSortColumn) => void,
  columnId: StockProductsSortColumn,
) {
  return {
    getIsSorted: () => {
      if (sort?.columnId !== columnId) return false as const;
      return sort.direction;
    },
    toggleSorting: () => onSortChange(columnId),
  };
}

export function createStockColumns(
  actions: StockTableActions,
  sortProps?: StockTableSortProps,
): ColumnDef<StockProduct>[] {
  const sort = sortProps?.sort ?? null;
  const onSortChange = sortProps?.onSortChange ?? (() => undefined);
  const header = (label: string, columnId: StockProductsSortColumn) => (
    <StockSortableHeader
      label={label}
      column={sortableColumn(sort, onSortChange, columnId)}
    />
  );

  return [
    {
      id: "name",
      accessorKey: "name",
      header: () => header("Nome", "name"),
      cell: ({ row }) => {
        const { name, photoUrl } = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={name}
                  fill
                  className="rounded-md bg-muted object-cover"
                  unoptimized
                />
              ) : (
                <div className="size-10 rounded-md bg-muted" />
              )}
            </div>
            <span className="font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      id: "category",
      accessorKey: "category",
      header: () => header("Categoria", "category"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.category}</span>
      ),
    },
    {
      id: "sku",
      accessorKey: "sku",
      header: () => header("SKU", "sku"),
      cell: ({ row }) => (
        <code className="text-sm text-muted-foreground">{row.original.sku}</code>
      ),
    },
    {
      id: "supplier",
      accessorFn: (row) => row.supplier?.name ?? "",
      header: () => header("Fornecedor", "supplier"),
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        return supplier ? (
          <span>{supplier.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: () => header("Quantidade", "quantity"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.quantity}</span>
          <span className="text-xs text-muted-foreground">
            Mín: {row.original.minQuantity}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: () => header("Status", "status"),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={cn("capitalize", STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      id: "activeValue",
      accessorKey: "activeValue",
      header: () => header("Valor do Ativo", "activeValue"),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.activeValue)}</span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <CellAction
            data={row.original}
            onEdit={actions.onEdit}
            onWithdraw={actions.onWithdraw}
            onViewHistory={actions.onViewHistory}
          />
        </div>
      ),
    },
  ];
}
