"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BackButton } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { SaleOrderFormSkeleton } from "@/features/sales-orders/components/sale-order-form-skeleton";
import { SaleOrderFormView } from "@/features/sales-orders/components/sale-order-form-view";
import { saleOrderToFormValues } from "@/features/sales-orders/api/sale-order.mapper";
import { useSaleOrderQuery } from "@/features/sales-orders/hooks/use-sale-order-queries";
import { isSaleOrderReadOnly } from "@/features/sales-orders/lib/sale-order-read-only";

type SaleEditPageProps = {
  saleId: string;
};

export function SaleEditPage({ saleId }: SaleEditPageProps) {
  const query = useSaleOrderQuery(saleId);
  const sale = query.data;

  if (query.isLoading) {
    return <SaleOrderFormSkeleton />;
  }

  if (query.isError) {
    return (
      <Box sx={{ p: 3 }}>
        <ListLoadErrorAlert
          title="Não foi possível carregar a venda"
          onRetry={() => void query.refetch()}
        />
      </Box>
    );
  }

  if (!sale || sale.deletedAt) {
    return (
      <Box
        component="section"
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <BackButton href="/vendas" label="Voltar" />
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Venda não encontrada
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            Esta venda não existe ou foi excluída.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <SaleOrderFormView
      orderId={sale.id}
      headerTitle={`Venda #${sale.number}`}
      headerSubtitle="Venda"
      backHref="/vendas"
      initialStatus="closed"
      statusLocked
      redirectPath="/vendas"
      initialValues={saleOrderToFormValues(sale)}
      channelId={sale.channelId}
      posDeliveryOrderNumber={sale.posDeliveryOrderNumber}
      formKey={`sale-edit-${sale.id}`}
      readOnly={isSaleOrderReadOnly(sale)}
      readOnlyReason={
        sale.status === "cancelled"
          ? "Esta venda foi cancelada. Os dados estão disponíveis apenas para visualização."
          : "Esta venda já movimentou estoque. Os dados estão disponíveis apenas para visualização."
      }
    />
  );
}
