"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, ConfirmationDialog } from "@/ui";
import { surfaceBorderRadius } from "@/theme/surface-styles";
import { VehicleModelImage } from "@/features/vehicle-models/components/vehicle-model-image";
import type { VehicleModelRow } from "@/features/vehicle-models/hooks/use-vehicle-model-list";
import {
  vehicleModelTypeBadgeLabel,
} from "@/features/vehicle-models/lib/vehicle-model-labels";

type VehicleModelCardProps = {
  row: VehicleModelRow;
  onEdit: (row: VehicleModelRow) => void;
  onActivate: (row: VehicleModelRow) => void;
  onDeactivate: (row: VehicleModelRow) => void;
};

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function VehicleModelCard({
  row,
  onEdit,
  onActivate,
  onDeactivate,
}: VehicleModelCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = row.status === "ACTIVE";
  const title = row.year != null ? `${row.model} ${row.year}` : row.model;

  function handleStatusAction() {
    if (isActive) {
      onDeactivate(row);
    } else {
      onActivate(row);
    }
    setConfirmOpen(false);
  }

  return (
    <>
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: surfaceBorderRadius,
          bgcolor: "background.paper",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          minHeight: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {row.brand}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Categoria
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {displayValue(row.category)}
            </Typography>
          </Box>
        </Stack>

        <VehicleModelImage imageUrl={row.imageUrl} alt={row.label} />

        <Box
          sx={{
            display: "inline-flex",
            alignSelf: "flex-start",
            px: 1.25,
            py: 0.25,
            borderRadius: 999,
            bgcolor: "action.hover",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.4 }}>
            {vehicleModelTypeBadgeLabel(row.type)}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            pt: 0.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Versão
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {displayValue(row.version)}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              FIPE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {displayValue(row.fipeCode)}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Tipo
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {vehicleModelTypeBadgeLabel(row.type)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
          <Button
            type="button"
            variant="contained"
            fullWidth
            onClick={() => onEdit(row)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={() => setConfirmOpen(true)}
            sx={{
              bgcolor: "action.hover",
              borderColor: "divider",
              color: "text.primary",
              "&:hover": {
                bgcolor: "action.selected",
                borderColor: "divider",
              },
            }}
          >
            {isActive ? "Desativar" : "Ativar"}
          </Button>
        </Stack>
      </Box>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title={isActive ? "Desativar modelo" : "Ativar modelo"}
        description={
          isActive
            ? `Desativar ${row.label}? Modelos inativos não aparecem em novos cadastros de veículo.`
            : `Ativar ${row.label}?`
        }
        confirmLabel={isActive ? "Desativar" : "Ativar"}
        cancelLabel="Cancelar"
        onConfirm={handleStatusAction}
      />
    </>
  );
}
