"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Badge } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { CategoryRowActions } from "@/features/categories/components/category-row-actions";
import type { CategoryListItem } from "@/features/categories/types/category";

type CategoryListTableProps = {
  categories: CategoryListItem[];
  pageIndex: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (category: CategoryListItem) => void;
  onDelete: (category: CategoryListItem) => void;
};

export function CategoryListTable({
  categories,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching = false,
  onPageIndexChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: CategoryListTableProps) {
  const columns = useMemo<DataTableColumn<CategoryListItem>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (category) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {category.name}
          </Typography>
        ),
      },
      {
        id: "productCount",
        header: "Produtos",
        render: (category) => (
          <Typography variant="body2" color="text.secondary">
            {category.productCount > 0 ? category.productCount : "—"}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (category) =>
          category.active ? (
            <Badge
              label="Ativo"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          ) : (
            <Badge
              label="Inativo"
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
        render: (category) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <CategoryRowActions
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
      emptyMessage="Nenhuma categoria encontrada."
      onRowClick={onEdit}
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

