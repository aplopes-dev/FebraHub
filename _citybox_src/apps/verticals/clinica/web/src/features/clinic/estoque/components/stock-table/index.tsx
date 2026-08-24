"use client";

import { useMemo } from "react";

import { cn } from "@citybox/ui";
import { DataTable } from "@citybox/ui/organisms";
import {
  ERP_DATA_TABLE_BODY_CLASS,
  ERP_DATA_TABLE_HEADER_CLASS,
  ERP_DATA_TABLE_ROOT_CLASS,
} from "@/features/shared/lib/data-table-styles";

import type { StockProductsSort, StockProductsSortColumn } from "../../lib/stock-sort";
import type { StockProduct } from "../../types";
import type { StockPageSize } from "../stock-pagination-bar";
import { createStockColumns } from "./columns";
import { StockPaginationBar } from "../stock-pagination-bar";

interface StockTableProps {
  products: StockProduct[];
  onEdit?: (product: StockProduct) => void;
  onWithdraw?: (product: StockProduct) => void;
  onViewHistory?: (product: StockProduct) => void;
  page: number;
  perPage: StockPageSize;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: StockPageSize) => void;
  sort: StockProductsSort;
  onSortChange: (columnId: StockProductsSortColumn) => void;
}

export function StockTable({
  products,
  onEdit,
  onWithdraw,
  onViewHistory,
  page,
  perPage,
  total,
  totalPages,
  onPageChange,
  onPerPageChange,
  sort,
  onSortChange,
}: StockTableProps) {
  const columns = useMemo(
    () =>
      createStockColumns(
        { onEdit, onWithdraw, onViewHistory },
        { sort, onSortChange },
      ),
    [onEdit, onWithdraw, onViewHistory, onSortChange, sort],
  );

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <DataTable
          columns={columns}
          data={products}
          entityName="produtos"
          pageSize={perPage}
          emptyMessage="Nenhum produto encontrado."
          enableSorting={false}
          manualPagination
          pageIndex={page - 1}
          pageCount={Math.max(totalPages, 1)}
          totalRowCount={total}
          paginationClassName="hidden"
          className={cn(
            ERP_DATA_TABLE_ROOT_CLASS,
            "min-w-0 max-w-full [&>div:first-child]:overflow-visible",
          )}
          tableWrapperClassName="overflow-visible"
          tableClassName={cn(ERP_DATA_TABLE_BODY_CLASS, "min-w-[56rem]")}
          headerClassName={ERP_DATA_TABLE_HEADER_CLASS}
        />
      </div>

      <StockPaginationBar
        page={page}
        pageSize={perPage}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPerPageChange}
      />
    </div>
  );
}
