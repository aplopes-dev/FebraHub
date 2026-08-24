"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BackButton } from "@/components/ui/form";
import { PurchaseFormView } from "@/features/purchases/components/purchase-form-view";
import { usePurchaseQuery } from "@/features/purchases/hooks/use-purchase-queries";
import { purchaseToFormValues } from "@/features/purchases/lib/purchase-to-form-values";

type PurchaseEditPageProps = {
  purchaseId: string;
};

export function PurchaseEditPage({ purchaseId }: PurchaseEditPageProps) {
  const { data: purchase, isLoading, isError } = usePurchaseQuery(purchaseId);

  const initialValues = useMemo(
    () => (purchase ? purchaseToFormValues(purchase) : undefined),
    [purchase],
  );
  const isLocked = Boolean(purchase?.stockMovementId);

  if (isLoading) {
    return (
      <Box
        component="section"
        sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, p: 2 }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Carregando os dados da compra…
        </Typography>
      </Box>
    );
  }

  if (isError || !purchase || purchase.deletedAt != null || !initialValues) {
    return (
      <Box
        component="section"
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
          p: 2,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Compra não encontrada
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            A compra solicitada não existe ou foi excluída.
          </Typography>
        </Stack>
        <BackButton href="/estoque/compras" label="Voltar para compras" />
      </Box>
    );
  }

  return (
    <PurchaseFormView
      key={purchase.id}
      purchaseId={purchase.id}
      title={isLocked ? "Compra recebida" : "Editar compra"}
      initialValues={initialValues}
      readOnly={isLocked}
    />
  );
}
