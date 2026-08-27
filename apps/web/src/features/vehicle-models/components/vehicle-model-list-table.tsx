"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Typography } from "@/ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { VehicleModelImage } from "@/features/vehicle-models/components/vehicle-model-image";
import { VehicleModelRowActions } from "@/features/vehicle-models/components/vehicle-model-row-actions";
import type { VehicleModelRow } from "@/features/vehicle-models/hooks/use-vehicle-model-list";
import {
  vehicleModelStatusLabel,
  vehicleModelTypeLabel,
} from "@/features/vehicle-models/lib/vehicle-model-labels";

type VehicleModelListTableProps = {
  rows: VehicleModelRow[];
  isFetching?: boolean;
  pageScroll?: boolean;
  onEdit: (row: VehicleModelRow) => void;
  onActivate: (row: VehicleModelRow) => void;
  onDeactivate: (row: VehicleModelRow) => void;
};

export function VehicleModelListTable({
  rows,
  isFetching = false,
  pageScroll = false,
  onEdit,
  onActivate,
  onDeactivate,
}: VehicleModelListTableProps) {
  const columns = useMemo<DataTableColumn<VehicleModelRow>[]>(
    () => [
      {
        id: "model",
        header: "Modelo",
        render: (row) => (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", minWidth: 0 }}
          >
            <VehicleModelImage
              variant="thumb"
              imageUrl={row.imageUrl}
              alt={row.label}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {row.label}
              </Typography>
              <Typography variant="caption" noWrap color="text.secondary">
                {row.brand}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        width: 120,
        render: (row) => (
          <Typography variant="body2" color="text.secondary">
            {vehicleModelTypeLabel(row.type)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 120,
        render: (row) =>
          row.status === "ACTIVE" ? (
            <Badge
              label={vehicleModelStatusLabel(row.status)}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          ) : (
            <Badge
              label={vehicleModelStatusLabel(row.status)}
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
        render: (row) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <VehicleModelRowActions
              row={row}
              onEdit={onEdit}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onActivate, onDeactivate],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      emptyMessage="Nenhum modelo encontrado."
      onRowClick={onEdit}
      isLoading={isFetching}
      pageScroll={pageScroll}
    />
  );
}
