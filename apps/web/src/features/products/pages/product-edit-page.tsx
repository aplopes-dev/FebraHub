"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Skeleton, Typography } from "@/ui";
import { BackButton } from "@/components/ui/form";
import { ProductFormView } from "@/features/products/components/product-form-view";
import { productDtoToFormValues } from "@/features/products/lib/product-to-form-values";
import { useProductQuery } from "@/features/products/hooks/use-product-queries";
import { useActiveSuppliersQuery } from "@/features/suppliers";

type ProductEditPageProps = {
  productId: string;
};

export function ProductEditPage({ productId }: ProductEditPageProps) {
  const { data: product, isLoading, isError } = useProductQuery(productId);
  // Nomes dos fornecedores não vêm no DTO do produto — cruzamos com o
  // cadastro ativo para preencher o combobox na reidratação.
  const suppliersQuery = useActiveSuppliersQuery();

  const supplierNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const supplier of suppliersQuery.data ?? []) {
      map.set(supplier.id, supplier.name);
    }
    return map;
  }, [suppliersQuery.data]);

  if (isLoading || suppliersQuery.isLoading) {
    return (
      <Box
        component="section"
        sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 3, p: 1 }}
      >
        <Stack spacing={1}>
          <Skeleton variant="text" width={96} height={20} />
          <Skeleton variant="text" width={288} height={32} />
        </Stack>
        <Skeleton
          variant="rounded"
          height={40}
          sx={{ maxWidth: 512, width: "100%" }}
        />
        <Skeleton variant="rounded" height={256} sx={{ width: "100%" }} />
      </Box>
    );
  }

  if (isError || !product) {
    return (
      <Box
        component="section"
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
          p: 1,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Produto não encontrado
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 0.5,
            }}
          >
            O produto solicitado não existe ou foi removido.
          </Typography>
        </Box>
        <BackButton href="/catalogo/produtos" label="Voltar para produtos" />
      </Box>
    );
  }

  return (
    <ProductFormView
      formKey={product.id}
      productId={product.id}
      title={product.name}
      initialValues={productDtoToFormValues(product, supplierNames)}
    />
  );
}
