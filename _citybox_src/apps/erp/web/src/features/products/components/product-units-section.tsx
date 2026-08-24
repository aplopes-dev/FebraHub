"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";

type ProductUnitsSectionProps = {
  selectedUnitIds: string[];
  onSelectedUnitIdsChange: (unitIds: string[]) => void;
};

export function ProductUnitsSection({
  selectedUnitIds,
  onSelectedUnitIdsChange,
}: ProductUnitsSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const units = useBranchUnits();
  const totalUnits = units.length;
  const selectedCount = selectedUnitIds.length;

  return (
    <>
      <Box component="section" sx={productFormSectionGridSx}>
        <Box component="header" sx={productFormSectionHeaderSx}>
          <Typography component="h2" variant="subtitle1" sx={{
            fontWeight: 600
          }}>
            Unidades
          </Typography>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Selecione as empresas onde o produto estará disponível para venda e
            utilização.
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
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{
                fontWeight: 500
              }}>
                Escolha em quais unidades exibir
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {selectedCount} de {totalUnits} unidades selecionadas
              </Typography>
            </Box>
            <Button
              type="button"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation();
                setDrawerOpen(true);
              }}
              endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
            >
              Selecionar
            </Button>
          </Box>
        </Box>
      </Box>
      <ProductUnitsDrawer
        units={units}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={selectedUnitIds}
        onSave={onSelectedUnitIdsChange}
      />
    </>
  );
}
