"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";

type MovementCategoryUnitsSectionProps = {
  selectedUnitIds: string[];
  onSelectedUnitIdsChange: (unitIds: string[]) => void;
};

export function MovementCategoryUnitsSection({
  selectedUnitIds,
  onSelectedUnitIdsChange,
}: MovementCategoryUnitsSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const units = useBranchUnits();
  const totalUnits = units.length;
  const selectedCount = selectedUnitIds.length;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Seleção de unidades
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Escolha em quais unidades exibir
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedCount} de {totalUnits} unidades selecionadas
            </Typography>
          </Stack>
          <Button type="button" onClick={() => setDrawerOpen(true)}>
            Selecionar unidades
          </Button>
        </Stack>
      </Box>

      <ProductUnitsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={selectedUnitIds}
        onSave={onSelectedUnitIdsChange}
        units={units}
      />
    </>
  );
}
