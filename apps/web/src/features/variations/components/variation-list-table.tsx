"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Checkbox, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { VariationRowActions } from "@/features/variations/components/variation-row-actions";
import { formatVariationOptions } from "@/features/variations/api/variations.service";
import type { Variation } from "@/features/variations/types/variation";

type VariationListTableProps = {
  variations: Variation[];
  /** Página 1-based (hook / store). */
  page: number;
  total: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onToggleSelectOne: (id: string) => void;
  onEdit: (variation: Variation) => void;
  onDelete: (variation: Variation) => void;
};

export function VariationListTable({
  variations,
  page,
  total,
  pageSize,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelectAllPage,
  onToggleSelectOne,
  onEdit,
  onDelete,
}: VariationListTableProps) {
  const columns = useMemo<DataTableColumn<Variation>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{ input: { "aria-label": "Selecionar todos desta página" } }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={() => onToggleSelectAllPage()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        render: (variation) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Checkbox
              slotProps={{ input: { "aria-label": `Selecionar ${variation.name}` } }}
              checked={selectedIds.has(variation.id)}
              onChange={() => onToggleSelectOne(variation.id)}
            />
          </Box>
        ),
      },
      {
        id: "name",
        header: "Nome",
        render: (variation) => (
          <Typography variant="body2" noWrap sx={{
            fontWeight: 600
          }}>
            {variation.name}
          </Typography>
        ),
      },
      {
        id: "options",
        header: "Opções",
        render: (variation) => (
          <Typography variant="body2" noWrap sx={{
            color: "text.secondary"
          }}>
            {formatVariationOptions(variation) || "—"}
          </Typography>
        ),
      },
      {
        id: "product",
        header: "Produto",
        render: (variation) => (
          <Typography variant="body2" noWrap sx={{
            color: "text.secondary"
          }}>
            {variation.productName}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (variation) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <VariationRowActions
              variation={variation}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Box>
        ),
      },
    ],
    [
      allPageSelected,
      somePageSelected,
      selectedIds,
      onToggleSelectAllPage,
      onToggleSelectOne,
      onEdit,
      onDelete,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={variations}
      getRowId={(variation) => variation.id}
      emptyMessage="Nenhuma variação encontrada."
      isLoading={isFetching}
      onRowClick={onEdit}
      getRowClassName={(variation) =>
        selectedIds.has(variation.id) ? "variation-row-selected" : ""
      }
      sx={{
        "& .MuiTableRow-root.variation-row-selected": {
          bgcolor: "action.selected",
        },
      }}
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
