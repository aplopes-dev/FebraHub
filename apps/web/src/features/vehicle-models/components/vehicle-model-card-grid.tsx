"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { VehicleModelCard } from "@/features/vehicle-models/components/vehicle-model-card";
import type { VehicleModelRow } from "@/features/vehicle-models/hooks/use-vehicle-model-list";

type VehicleModelCardGridProps = {
  rows: VehicleModelRow[];
  isFetching?: boolean;
  onEdit: (row: VehicleModelRow) => void;
  onActivate: (row: VehicleModelRow) => void;
  onDeactivate: (row: VehicleModelRow) => void;
};

export function VehicleModelCardGrid({
  rows,
  isFetching = false,
  onEdit,
  onActivate,
  onDeactivate,
}: VehicleModelCardGridProps) {
  if (isFetching && rows.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress size={32} aria-label="Carregando modelos" />
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Nenhum modelo encontrado.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
        },
        gap: 2,
        opacity: isFetching ? 0.72 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      {rows.map((row) => (
        <VehicleModelCard
          key={row.id}
          row={row}
          onEdit={onEdit}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      ))}
    </Box>
  );
}
