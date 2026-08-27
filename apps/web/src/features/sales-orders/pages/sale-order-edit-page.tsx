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

type SaleOrderEditPageProps = {
  orderId: string;
};

export function SaleOrderEditPage({ orderId }: SaleOrderEditPageProps) {
  const query = useSaleOrderQuery(orderId);
  const order = query.data;

  if (query.isLoading) {
    return <SaleOrderFormSkeleton />;
  }

  if (query.isError) {
    return (
      <Box sx={{ p: 3 }}>
        <ListLoadErrorAlert
          title="Não foi possível carregar o pedido"
          onRetry={() => void query.refetch()}
        />
      </Box>
    );
  }

  if (!order || order.deletedAt) {
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
        <BackButton href="/vendas/pedidos-de-venda" label="Voltar" />
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Pedido não encontrado
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            Este pedido de venda não existe ou foi excluído.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <SaleOrderFormView
      orderId={order.id}
      headerTitle={`Pedido de Venda #${order.number}`}
      backHref="/vendas/pedidos-de-venda"
      initialValues={saleOrderToFormValues(order)}
      channelId={order.channelId}
      posDeliveryOrderNumber={order.posDeliveryOrderNumber}
      posDeliveryFulfillment={order.posDeliveryFulfillment}
      formKey={`edit-${order.id}`}
      readOnly={isSaleOrderReadOnly(order)}
      readOnlyReason={
        order.status === "cancelled"
          ? "Este pedido foi cancelado. Os dados estão disponíveis apenas para visualização."
          : "Este pedido já movimentou estoque. Os dados estão disponíveis apenas para visualização."
      }
    />
  );
}
