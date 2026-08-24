"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { useEmitterRegime } from "@/features/fiscal-pis-cofins-group/hooks/use-emitter-regime";
import { IcmsGroupFormView } from "../components/icms-group-form-view";

const LIST_PATH = "/configuracoes/fiscal/grupos-icms";

export function IcmsGroupCreatePage() {
  const { regime, isLoading, isError } = useEmitterRegime();
  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton href={LIST_PATH} label="Voltar para grupos" />
        <PageHeader title="Novo grupo do ICMS" />
        {/* Espera o regime resolver: define se a situação é CST (Normal) ou CSOSN (Simples). */}
        {isLoading ? (
          <Skeleton variant="rounded" height={320} />
        ) : isError ? (
          <Alert severity="error">
            Não foi possível identificar o regime tributário do Emitente, que
            define as situações de ICMS disponíveis. Recarregue a página e
            tente novamente.
          </Alert>
        ) : (
          <IcmsGroupFormView regime={regime} />
        )}
      </Box>
    </FiscalScrollablePage>
  );
}
