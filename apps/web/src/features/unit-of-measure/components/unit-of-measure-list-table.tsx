"use client";

import { useMemo } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { ActiveStatusBadge } from "@/components/ui/status";
import { RowActionsMenu } from "@/components/ui/list-page";
import {
  UNIT_KIND_LABELS,
  type UnitOfMeasure,
} from "@/features/unit-of-measure/types/unit-of-measure";

type UnitOfMeasureListTableProps = {
  units: UnitOfMeasure[];
  page: number;
  total: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (unit: UnitOfMeasure) => void;
  onDelete: (unit: UnitOfMeasure) => void;
};

export function UnitOfMeasureListTable({
  units,
  page,
  total,
  pageSize,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: UnitOfMeasureListTableProps) {
  const columns = useMemo<DataTableColumn<UnitOfMeasure>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (unit) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {unit.name}
          </Typography>
        ),
      },
      {
        id: "abbreviation",
        header: "Sigla",
        render: (unit) => (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1,
              py: 0.25,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "action.hover",
              fontFamily: "monospace",
              fontSize: "0.75rem",
            }}
          >
            {unit.abbreviation}
          </Box>
        ),
      },
      {
        id: "kind",
        header: "Tipo",
        render: (unit) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {UNIT_KIND_LABELS[unit.kind]}
          </Typography>
        ),
      },
      {
        id: "decimalPlaces",
        header: "Casas decimais",
        render: (unit) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {unit.decimalPlaces}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (unit) => <ActiveStatusBadge active={unit.active} />,
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (unit) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <RowActionsMenu
              ariaLabel={`Ações de ${unit.name}`}
              items={[
                {
                  id: "edit",
                  label: "Editar",
                  icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
                  onClick: () => onEdit(unit),
                },
                {
                  id: "delete",
                  label: "Excluir",
                  icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
                  onClick: () => onDelete(unit),
                  destructive: true,
                  dividerBefore: true,
                },
              ]}
              confirmDelete={{
                title: "Excluir unidade de medida?",
                description: (
                  <>
                    Tem certeza que deseja excluir{" "}
                    <span style={{ fontWeight: 600 }}>{unit.name}</span>? Essa
                    ação não pode ser desfeita.
                  </>
                ),
                onConfirm: () => onDelete(unit),
              }}
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
      rows={units}
      getRowId={(unit) => unit.id}
      isLoading={isFetching}
      emptyMessage="Nenhuma unidade de medida encontrada."
      onRowClick={onEdit}
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
