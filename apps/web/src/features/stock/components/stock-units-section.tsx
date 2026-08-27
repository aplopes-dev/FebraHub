"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";

type StockUnitsSectionProps = {
  selectedUnitIds: string[];
  onSelectedUnitIdsChange: (unitIds: string[]) => void;
};

export function StockUnitsSection({
  selectedUnitIds,
  onSelectedUnitIdsChange,
}: StockUnitsSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const units = useBranchUnits();
  const totalUnits = units.length;
  const selectedCount = selectedUnitIds.length;

  return (
    <>
      <Box component="section" sx={productFormSectionGridSx}>
        <Box component="header" sx={productFormSectionHeaderSx}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
            Unidades
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Selecione as unidades que vão ter acesso a este estoque.
          </Typography>
        </Box>

        <Box sx={productFormSectionBoxSx}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setDrawerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setDrawerOpen(true);
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              width: "100%",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              px: 2,
              py: 1.5,
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Unidades
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCount} de {totalUnits} unidades selecionadas
              </Typography>
            </Stack>
            <Button
              type="button"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation();
                setDrawerOpen(true);
              }}
              endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
            >
              Selecionar unidades
            </Button>
          </Box>
        </Box>
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
