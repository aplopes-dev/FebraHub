"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { CarrierSection } from "@/features/carriers/components/carrier-section";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";

type CarrierUnitsSectionProps = {
  selectedUnitIds: string[];
  onChange: (unitIds: string[]) => void;
};

export function CarrierUnitsSection({
  selectedUnitIds,
  onChange,
}: CarrierUnitsSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const units = useBranchUnits();
  const totalUnits = units.length;

  return (
    <>
      <CarrierSection
        title="Unidades"
        description="Selecione as empresas que vão ter acesso a este cadastro."
      >
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
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Escolha em quais unidades exibir
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedUnitIds.length} de {totalUnits} unidades selecionadas
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
            Selecionar unidades
          </Button>
        </Box>
      </CarrierSection>

      <ProductUnitsDrawer
        units={units}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={selectedUnitIds}
        onSave={onChange}
      />
    </>
  );
}
