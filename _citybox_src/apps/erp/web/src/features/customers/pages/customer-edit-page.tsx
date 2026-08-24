"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CustomerFormHeader } from "@/features/customers/components/customer-form-header";
import { CustomerFormView } from "@/features/customers/components/customer-form-view";
import { useCustomerFormValuesQuery } from "@/features/customers/hooks/use-customer-queries";

type CustomerEditPageProps = {
  customerId: string;
};

/**
 * Tela de edição de cliente (spec erp/029/B2) — molde de `SupplierEditPage`
 * (mesmo padrão das features irmãs `suppliers`/`carriers`/`branches`).
 */
export function CustomerEditPage({ customerId }: CustomerEditPageProps) {
  const { data: values, isLoading, isError } =
    useCustomerFormValuesQuery(customerId);

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <CustomerFormHeader title="Carregando…" />
        <Typography variant="body2" color="text.secondary">
          Carregando os dados do cliente…
        </Typography>
      </Stack>
    );
  }

  if (isError || !values) {
    return (
      <Stack spacing={4}>
        <CustomerFormHeader title="Cliente não encontrado" />
        <Box>
          <Typography variant="body2" color="text.secondary">
            Este cliente não existe ou não pertence à empresa ativa.
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <CustomerFormView
      title={values.name}
      customerId={customerId}
      initialValues={values}
      // Achado B11 da spec 019 (bug de baseline stale em telas fiscais):
      // remonta o form quando o id muda (navegar de um cliente pra outro
      // sem passar pela lista) — evita editar com o baseline do cliente
      // anterior ainda em memória.
      formKey={customerId}
    />
  );
}
