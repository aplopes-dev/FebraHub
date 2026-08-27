"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { CustomerCategoryRowActions } from "@/features/customer-categories/components/customer-category-row-actions";
import type { CustomerCategory } from "@/features/customer-categories/types/customer-category";

type CustomerCategoryListTableProps = {
  categories: CustomerCategory[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (category: CustomerCategory) => void;
  onDelete: (category: CustomerCategory) => void;
};

export function CustomerCategoryListTable({
  categories,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: CustomerCategoryListTableProps) {
  const columns = useMemo<DataTableColumn<CustomerCategory>[]>(
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
        id: "discountPercentage",
        header: "Desconto",
        render: (category) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {category.discountPercentage}%
          </Typography>
        ),
      },
      {
        id: "customerCount",
        header: "Clientes",
        render: (category) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {category.customerCount}
          </Typography>
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
            <CustomerCategoryRowActions
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
      emptyMessage="Nenhuma categoria de cliente encontrada."
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
