"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { CostCenterRowActions } from "@/features/cost-centers/components/cost-center-row-actions";
import type { CostCenter } from "@/features/cost-centers/types/cost-center";

type CostCenterListTableProps = {
  costCenters: CostCenter[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (costCenter: CostCenter) => void;
  onRestore: (costCenter: CostCenter) => void;
};

export function CostCenterListTable({
  costCenters,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching,
  onPageIndexChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onRestore,
}: CostCenterListTableProps) {
  const columns = useMemo<DataTableColumn<CostCenter>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (costCenter) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {costCenter.name}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (costCenter) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <CostCenterRowActions
              costCenter={costCenter}
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
      rows={costCenters}
      getRowId={(costCenter) => costCenter.id}
      emptyMessage="Nenhum centro de custo encontrado."
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
