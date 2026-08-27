"use client";

import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { ProductionTypeBadge } from "@/features/technical-sheets/components/production-type-badge";
import { TechnicalSheetRowActions } from "@/features/technical-sheets/components/technical-sheet-row-actions";
import type { TechnicalSheetListItem } from "@/features/technical-sheets/types/technical-sheet";

type TechnicalSheetListTableProps = {
  sheets: TechnicalSheetListItem[];
  /** Página 1-based (API / Zustand). */
  page: number;
  total: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function TechnicalSheetListTable({
  sheets,
  page,
  total,
  pageSize,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
}: TechnicalSheetListTableProps) {
  const columns = useMemo<DataTableColumn<TechnicalSheetListItem>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (sheet) => (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              {sheet.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sheet.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <AssignmentOutlined sx={{ fontSize: 16, color: "text.secondary" }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {sheet.name}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: "sku",
        header: "Código SKU",
        render: (sheet) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {sheet.sku}
          </Typography>
        ),
      },
      {
        id: "category",
        header: "Categoria",
        render: (sheet) => sheet.category,
      },
      {
        id: "productionType",
        header: "Tipo de produção",
        render: (sheet) => (
          <ProductionTypeBadge type={sheet.productionType} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (sheet) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <TechnicalSheetRowActions sheet={sheet} />
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={sheets}
      getRowId={(sheet) => sheet.id}
      isLoading={isFetching}
      emptyMessage="Nenhuma ficha técnica encontrada."
      getRowHref={(sheet) => `/catalogo/fichas-tecnicas/${sheet.id}`}
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
