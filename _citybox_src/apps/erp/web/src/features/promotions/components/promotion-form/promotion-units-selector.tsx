"use client";

import { useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";

type PromotionUnitsSelectorProps = {
  selectedUnitIds: string[];
  onChange: (unitIds: string[]) => void;
};

/**
 * Seleção de unidades onde a promoção fica válida. Reaproveita o drawer de
 * unidades de Produtos (unidades reais da empresa ativa).
 */
export function PromotionUnitsSelector({
  selectedUnitIds,
  onChange,
}: PromotionUnitsSelectorProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalUnits = useBranchUnits().length;
  const selectedCount = selectedUnitIds.length;

  function openDrawer() {
    setDrawerOpen(true);
  }

  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        onClick={openDrawer}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDrawer();
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          width: "100%",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          bgcolor: "background.paper",
          "&:hover": { borderColor: "primary.main" },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Selecionar em quais unidades exibir esta promoção
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {selectedCount} de {totalUnits} unidades selecionadas
          </Typography>
        </Box>
        <Button
          type="button"
          variant="outlined"
          size="small"
          endIcon={<ChevronRightIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openDrawer();
          }}
          sx={{ flexShrink: 0 }}
        >
          Selecionar
        </Button>
      </Box>

      <ProductUnitsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={selectedUnitIds}
        onSave={onChange}
      />
    </>
  );
}
