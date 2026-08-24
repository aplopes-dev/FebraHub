"use client";

import InfoOutlined from "@mui/icons-material/InfoOutlined";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Badge, Tooltip } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { SupplierRowActions } from "@/features/suppliers/components/supplier-row-actions";
import {
  documentLabel,
  PERSON_TYPE_LABELS,
  type Supplier,
} from "@/features/suppliers/types/supplier";

type SupplierListTableProps = {
  suppliers: Supplier[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick?: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onRestore: (supplier: Supplier) => void;
};

export function SupplierListTable({
  suppliers,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching = false,
  onPageIndexChange,
  onPageSizeChange,
  onRowClick,
  onEdit,
  onDelete,
  onRestore,
}: SupplierListTableProps) {
  const columns = useMemo<DataTableColumn<Supplier>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (supplier) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {supplier.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {supplier.legalName || "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "document",
        header: "CPF/CNPJ",
        render: (supplier) => (
          <Typography variant="body2" color="text.secondary">
            {supplier.document || "—"}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 0.75 }}
            >
              ({documentLabel(supplier.personType)})
            </Typography>
          </Typography>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        render: (supplier) => (
          <Badge
            label={PERSON_TYPE_LABELS[supplier.personType]}
            color="muted"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        ),
      },
      {
        id: "info",
        header: "",
        width: 56,
        align: "center",
        render: (supplier) => {
          const unitsLabel =
            supplier.unitIds.length === 1
              ? "1 unidade"
              : `${supplier.unitIds.length} unidades`;

          return (
            <Box onClick={(event) => event.stopPropagation()}>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {supplier.legalName || supplier.name}
                    </Typography>
                    <Typography variant="caption">
                      {supplier.contact.email || "Sem e-mail"} · {unitsLabel}
                    </Typography>
                  </Box>
                }
              >
                <IconButton
                  type="button"
                  aria-label={`Informações de ${supplier.name}`}
                  sx={{ color: "text.secondary" }}
                >
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (supplier) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <SupplierRowActions
              supplier={supplier}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onDelete, onRestore],
  );

  return (
    <DataTable
      columns={columns}
      rows={suppliers}
      getRowId={(supplier) => supplier.id}
      emptyMessage="Nenhum fornecedor encontrado."
      onRowClick={onRowClick}
      isLoading={isFetching}
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
