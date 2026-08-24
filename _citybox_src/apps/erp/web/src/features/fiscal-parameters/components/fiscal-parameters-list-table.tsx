"use client";

import { useMemo } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { Box, Stack, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { RowActionsMenu } from "@/components/ui/list-page";
import { FiscalStatusBadge } from "@/features/fiscal-parameters/components/fiscal-status-badge";
import type { FiscalParameterListItem } from "@/features/fiscal-parameters/types/fiscal-parameters";

type FiscalParametersListTableProps = {
  items: FiscalParameterListItem[];
  page: number;
  total: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function FiscalParametersListTable({
  items,
  page,
  total,
  pageSize,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
}: FiscalParametersListTableProps) {
  const columns = useMemo<DataTableColumn<FiscalParameterListItem>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (item) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
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
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              )}
            </Box>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {item.name}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "sku",
        header: "Código SKU",
        render: (item) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {item.sku}
          </Typography>
        ),
      },
      {
        id: "category",
        header: "Categoria",
        render: (item) => item.category,
      },
      {
        id: "status",
        header: "Situação fiscal",
        render: (item) => (
          <FiscalStatusBadge
            status={item.configured ? "configured" : "pending"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (item) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <RowActionsMenu
              ariaLabel={`Ações de ${item.name}`}
              items={[
                {
                  id: "edit",
                  label: "Editar parâmetros fiscais",
                  icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
                  href: `/catalogo/parametros-fiscais/${item.id}`,
                },
                {
                  id: "product",
                  label: "Ver produto",
                  icon: <Inventory2OutlinedIcon sx={{ fontSize: 16 }} />,
                  href: `/catalogo/produtos/${item.id}`,
                },
              ]}
            />
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={items}
      getRowId={(item) => item.id}
      isLoading={isFetching}
      emptyMessage="Nenhum produto encontrado."
      getRowHref={(item) => `/catalogo/parametros-fiscais/${item.id}`}
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
