"use client";

import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { usePosFiscalType } from "../hooks/use-pos-fiscal-type";
import { PosFiscalTypeForm } from "./pos-fiscal-type-form";

/** Aba "Tipo de NF (PDV)" da tela Fiscal (spec erp/013). */
export function PosFiscalTypeTab() {
  const {
    config,
    cscConfigured,
    hasValidCertificate,
    isCompanyMissing,
    isLoading,
    isError,
  } = usePosFiscalType();

  if (isLoading) {
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Skeleton variant="rounded" height={90} />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    );
  }

  if (isCompanyMissing) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        O emitente fiscal ainda não está configurado. Envie o certificado digital
        na aba <strong>Certificado</strong> para habilitar a configuração fiscal do PDV.
      </Alert>
    );
  }

  if (isError || !config) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Não foi possível carregar a configuração. Tente novamente.
      </Alert>
    );
  }

  return (
    <PosFiscalTypeForm
      key={config.updatedAt}
      config={config}
      cscConfigured={cscConfigured}
      hasValidCertificate={hasValidCertificate}
    />
  );
}
