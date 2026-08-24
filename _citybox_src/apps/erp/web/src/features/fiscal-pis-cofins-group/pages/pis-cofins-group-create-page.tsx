"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { PisCofinsGroupFormView } from "../components/pis-cofins-group-form-view";
import { useEmitterRegime } from "../hooks/use-emitter-regime";

const LIST_PATH = "/configuracoes/fiscal/grupos-pis-cofins";

export function PisCofinsGroupCreatePage() {
  const { regime, isLoading } = useEmitterRegime();
  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton href={LIST_PATH} label="Voltar para grupos" />
        <PageHeader title="Novo grupo de PIS/COFINS" />
        {/* Espera o regime resolver para o form nascer com o pré-preenchimento certo. */}
        {isLoading ? (
          <Skeleton variant="rounded" height={280} />
        ) : (
          <PisCofinsGroupFormView regime={regime} />
        )}
      </Box>
    </FiscalScrollablePage>
  );
}
