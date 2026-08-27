"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SupplierFormHeader } from "@/features/suppliers/components/supplier-form-header";
import { SupplierFormView } from "@/features/suppliers/components/supplier-form-view";
import { useSupplierQuery } from "@/features/suppliers/hooks/use-supplier-queries";
import { supplierToFormValues } from "@/features/suppliers/services/supplier.service";

type SupplierEditPageProps = {
  supplierId: string;
};

export function SupplierEditPage({ supplierId }: SupplierEditPageProps) {
  const { data: supplier, isLoading, isError } = useSupplierQuery(supplierId);

  const initialValues = useMemo(
    () => (supplier ? supplierToFormValues(supplier) : undefined),
    [supplier],
  );

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <SupplierFormHeader title="Carregando…" />
        <Typography variant="body2" color="text.secondary">
          Carregando os dados do fornecedor…
        </Typography>
      </Stack>
    );
  }

  if (isError || !supplier || !initialValues) {
    return (
      <Stack spacing={4}>
        <SupplierFormHeader title="Fornecedor não encontrado" />
        <Box>
          <Typography variant="body2" color="text.secondary">
            Este fornecedor não existe ou não pertence à empresa ativa.
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <SupplierFormView
      title={supplier.name}
      supplierId={supplier.id}
      initialValues={initialValues}
    />
  );
}
