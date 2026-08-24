"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { MovementCategoryRowActions } from "@/features/movement-categories/components/movement-category-row-actions";
import { MovementCategoryTypeBadge } from "@/features/movement-categories/components/movement-category-type-badge";
import type { MovementCategoryListItem } from "@/features/movement-categories/types/movement-category";

type MovementCategoryListTableProps = {
  categories: MovementCategoryListItem[];
  pageIndex: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (category: MovementCategoryListItem) => void;
  onDelete: (category: MovementCategoryListItem) => void;
};

export function MovementCategoryListTable({
  categories,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching = false,
  onPageIndexChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: MovementCategoryListTableProps) {
  const columns = useMemo<DataTableColumn<MovementCategoryListItem>[]>(
    () => [
      {
        id: "code",
        header: "Código",
        render: (category) => (
          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {category.code}
          </Typography>
        ),
      },
      {
        id: "name",
        header: "Nome da categoria",
        render: (category) => (
          <Typography variant="body2">{category.name}</Typography>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        render: (category) => (
          <MovementCategoryTypeBadge type={category.type} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (category) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <MovementCategoryRowActions
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      rows={categories}
      getRowId={(category) => category.id}
      emptyMessage="Nenhuma categoria de movimentação encontrada."
      isLoading={isFetching}
      onRowClick={onEdit}
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
