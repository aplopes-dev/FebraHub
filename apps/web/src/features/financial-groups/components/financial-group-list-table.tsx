"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { FinancialGroupRowActions } from "@/features/financial-groups/components/financial-group-row-actions";
import { FinancialGroupTypeBadge } from "@/features/financial-groups/components/financial-group-type-badge";
import type { FinancialGroup } from "@/features/financial-groups/types/financial-group";

type FinancialGroupListTableProps = {
  groups: FinancialGroup[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (group: FinancialGroup) => void;
  onDelete: (group: FinancialGroup) => void;
  onRestore: (group: FinancialGroup) => void;
};

export function FinancialGroupListTable({
  groups,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching,
  onPageIndexChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onRestore,
}: FinancialGroupListTableProps) {
  const columns = useMemo<DataTableColumn<FinancialGroup>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (group) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {group.name}
          </Typography>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        render: (group) => <FinancialGroupTypeBadge type={group.type} />,
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (group) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <FinancialGroupRowActions
              group={group}
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
      rows={groups}
      getRowId={(group) => group.id}
      emptyMessage="Nenhum grupo financeiro encontrado."
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
