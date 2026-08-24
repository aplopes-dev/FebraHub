"use client";

import { useState } from "react";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { FormSection } from "@/components/ui/form";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";

type UserBranchesSectionProps = {
  form: UserFormApi;
};

/**
 * Seleção de unidades do membro (MEMBER). OWNER/ADMIN ignoram branchIds na API.
 * Oculta quando o perfil selecionado é de sistema (administrador → ADMIN).
 */
export function UserBranchesSection({ form }: UserBranchesSectionProps) {
  const { values, setField, requiresBranches } = form;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const units = useBranchUnits();

  if (!requiresBranches) return null;

  return (
    <>
      <FormSection
        title="Unidades"
        description="Escolha em quais unidades este usuário poderá operar. Perfis de administrador acessam todas automaticamente."
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
              Escolha as unidades de acesso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {values.branchIds.length} de {units.length} unidades selecionadas
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
      </FormSection>

      <ProductUnitsDrawer
        units={units}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={values.branchIds}
        onSave={(unitIds) => setField("branchIds", unitIds)}
      />
    </>
  );
}
