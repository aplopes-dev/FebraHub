"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CarrierFormHeader } from "@/features/carriers/components/carrier-form-header";
import { CarrierFormView } from "@/features/carriers/components/carrier-form-view";
import { useCarrierQuery } from "@/features/carriers/hooks/use-carrier-queries";
import { carrierToFormValues } from "@/features/carriers/services/carrier.service";

type CarrierEditPageProps = {
  carrierId: string;
};

export function CarrierEditPage({ carrierId }: CarrierEditPageProps) {
  const { data: carrier, isLoading, isError } = useCarrierQuery(carrierId);

  const initialValues = useMemo(
    () => (carrier ? carrierToFormValues(carrier) : undefined),
    [carrier],
  );

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <CarrierFormHeader title="Carregando…" />
        <Typography variant="body2" color="text.secondary">
          Carregando os dados da transportadora…
        </Typography>
      </Stack>
    );
  }

  if (isError || !carrier || !initialValues) {
    return (
      <Stack spacing={4}>
        <CarrierFormHeader title="Transportadora não encontrada" />
        <Box>
          <Typography variant="body2" color="text.secondary">
            Esta transportadora não existe ou não pertence à empresa ativa.
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <CarrierFormView
      title={carrier.tradeName}
      carrierId={carrier.id}
      initialValues={initialValues}
    />
  );
}
