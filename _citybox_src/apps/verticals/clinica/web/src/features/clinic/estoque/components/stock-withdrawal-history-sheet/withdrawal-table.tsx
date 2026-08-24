"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

import { cn } from "@citybox/ui";
import { DataTable, type ColumnDef } from "@citybox/ui/organisms";
import {
  ERP_DATA_TABLE_BODY_NO_ACTIONS_CLASS,
  ERP_DATA_TABLE_HEADER_NO_ACTIONS_CLASS,
  ERP_DATA_TABLE_ROOT_CLASS,
} from "@/features/shared/lib/data-table-styles";

import type { WithdrawalSort, WithdrawalSortColumn } from "../../lib/stock-sort";
import { StockSortableHeader } from "../stock-sortable-header";
import type { StockWithdrawal } from "./types";

interface WithdrawalTableProps {
  withdrawals: StockWithdrawal[];
  sort: WithdrawalSort;
  onSortChange: (columnId: WithdrawalSortColumn) => void;
}

function sortableColumn(
  sort: WithdrawalSort,
  onSortChange: (columnId: WithdrawalSortColumn) => void,
  columnId: WithdrawalSortColumn,
) {
  return {
    getIsSorted: () => {
      if (sort?.columnId !== columnId) return false as const;
      return sort.direction;
    },
    toggleSorting: () => onSortChange(columnId),
  };
}

export function WithdrawalTable({
  withdrawals,
  sort,
  onSortChange,
}: WithdrawalTableProps) {
  const columns = useMemo<ColumnDef<StockWithdrawal>[]>(() => {
    const header = (label: string, columnId: WithdrawalSortColumn, align?: "left" | "right") => (
      <StockSortableHeader
        label={label}
        column={sortableColumn(sort, onSortChange, columnId)}
        align={align}
      />
    );

    return [
      {
        id: "product",
        accessorFn: (row) => row.product.name,
        header: () => header("Produto", "product"),
        cell: ({ row }) => {
          const { product } = row.original;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-10 shrink-0">
                {product.photoUrl ? (
                  <Image
                    src={product.photoUrl}
                    alt={product.name}
                    fill
                    className="rounded-md bg-muted object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="size-10 rounded-md bg-muted" />
                )}
              </div>
              <span className="line-clamp-2 font-medium">{product.name}</span>
            </div>
          );
        },
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: () => header("Quantidade", "quantity"),
        cell: ({ row }) => (
          <span className="font-semibold text-rose-600">-{row.original.quantity}</span>
        ),
      },
      {
        id: "withdrawnBy",
        accessorKey: "withdrawnBy",
        header: () => header("Retirado por", "withdrawnBy"),
        cell: ({ row }) => (
          <span className="truncate font-medium">{row.original.withdrawnBy}</span>
        ),
      },
      {
        id: "authorizedBy",
        accessorKey: "authorizedBy",
        header: () => header("Autorizado por", "authorizedBy"),
        cell: ({ row }) => (
          <span className="truncate font-medium">{row.original.authorizedBy}</span>
        ),
      },
      {
        id: "date",
        accessorFn: (row) => row.date.getTime(),
        header: () => header("Data", "date"),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {format(row.original.date, "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(row.original.date, "HH:mm", { locale: ptBR })}
            </p>
          </div>
        ),
      },
    ];
  }, [onSortChange, sort]);

  return (
    <div className="min-w-0 max-w-full flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <DataTable
        columns={columns}
        data={withdrawals}
        entityName="retiradas"
        pageSize={withdrawals.length || 20}
        emptyMessage="Nenhum registro encontrado"
        emptyPaginationLabel="Nenhum registro"
        enableSorting={false}
        paginationClassName="hidden"
        className={cn(
          ERP_DATA_TABLE_ROOT_CLASS,
          "min-w-0 max-w-full [&>div:first-child]:overflow-visible",
        )}
        tableWrapperClassName="max-h-[calc(100vh-350px)] overflow-y-auto overflow-x-visible"
        tableClassName={cn(ERP_DATA_TABLE_BODY_NO_ACTIONS_CLASS, "min-w-[40rem]")}
        headerClassName={ERP_DATA_TABLE_HEADER_NO_ACTIONS_CLASS}
      />
    </div>
  );
}
