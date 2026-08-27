"use client";

import { useMemo } from "react";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Badge } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import {
  getStockBalanceStatus,
  STOCK_BALANCE_STATUS_LABELS,
  type StockBalanceItem,
  type StockBalanceStatus,
} from "@/features/stock/types/stock-balance";

type StockBalanceTableProps = {
  items: StockBalanceItem[];
  onViewMovements: (item: StockBalanceItem) => void;
  isLoading?: boolean;
  pageIndex?: number;
  pageCount?: number;
  totalRowCount?: number;
  pageSize?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

const STATUS_COLOR: Record<
  StockBalanceStatus,
  "success" | "warning" | "error"
> = {
  ok: "success",
  low: "warning",
  empty: "error",
};

export function StockBalanceTable({
  items,
  onViewMovements,
  isLoading = false,
  pageIndex = 0,
  pageCount: _pageCount = 1,
  totalRowCount,
  pageSize = 20,
  onPageIndexChange,
  onPageSizeChange,
}: StockBalanceTableProps) {
  const columns = useMemo<DataTableColumn<StockBalanceItem>[]>(
    () => [
      {
        id: "product",
        header: "Produto",
        render: (item) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              {item.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <Box
                  component="img"
                  src={item.productImageUrl}
                  alt=""
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {item.productName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
              >
                {item.productSku}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: "quantity",
        header: "Saldo",
        render: (item) => (
          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {item.quantity}{" "}
            <Typography component="span" variant="caption" color="text.secondary">
              {item.unit}
            </Typography>
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Situação",
        render: (item) => {
          const status = getStockBalanceStatus(item.quantity);
          return (
            <Badge
              label={STOCK_BALANCE_STATUS_LABELS[status]}
              color={STATUS_COLOR[status]}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          );
        },
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (item) => (
          <RowActionsMenu
            ariaLabel={`Ações de ${item.productName}`}
            items={[
              {
                id: "movements",
                label: "Movimentações",
                icon: <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />,
                onClick: () => onViewMovements(item),
              },
            ]}
          />
        ),
      },
    ],
    [onViewMovements],
  );

  return (
    <DataTable
      columns={columns}
      rows={items}
      getRowId={(item) => item.productId}
      emptyMessage="Nenhum produto com saldo neste estoque."
      isLoading={isLoading}
      pagination={
        onPageIndexChange && onPageSizeChange
          ? {
              page: pageIndex + 1,
              perPage: pageSize,
              total: totalRowCount ?? items.length,
              onPageChange: (nextPage) => onPageIndexChange(nextPage - 1),
              onPerPageChange: onPageSizeChange,
            }
          : undefined
      }
    />
  );
}
