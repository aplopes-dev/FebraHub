"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Badge } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { StockRowActions } from "@/features/stock/components/stock-row-actions";
import {
  getStockLocationLabel,
  getStockPropertyLabel,
  type Stock,
} from "@/features/stock/types/stock";

type StockListTableProps = {
  stocks: Stock[];
  pageIndex: number;
  totalRowCount: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDelete: (stock: Stock) => void;
  isLoading?: boolean;
};

export function StockListTable({
  stocks,
  pageIndex,
  totalRowCount,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onDelete,
  isLoading = false,
}: StockListTableProps) {
  const columns = useMemo<DataTableColumn<Stock>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (stock) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {stock.name}
          </Typography>
        ),
      },
      {
        id: "location",
        header: "Localização",
        render: (stock) => (
          <Typography variant="body2" color="text.secondary">
            {getStockLocationLabel(stock.location)}
          </Typography>
        ),
      },
      {
        id: "property",
        header: "Propriedade",
        render: (stock) => (
          <Badge
            label={getStockPropertyLabel(stock.property)}
            color="default"
            variant="outlined"
            sx={{ color: "text.secondary" }}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (stock) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <StockRowActions stock={stock} onDelete={onDelete} />
          </Box>
        ),
      },
    ],
    [onDelete],
  );

  return (
    <DataTable
      columns={columns}
      rows={stocks}
      getRowId={(stock) => stock.id}
      emptyMessage="Nenhum estoque encontrado."
      isLoading={isLoading}
      getRowHref={(stock) => `/estoque/${stock.id}`}
      pagination={{
        page: pageIndex + 1,
        perPage: pageSize,
        total: totalRowCount,
        onPageChange: (nextPage) => onPageIndexChange(nextPage - 1),
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
