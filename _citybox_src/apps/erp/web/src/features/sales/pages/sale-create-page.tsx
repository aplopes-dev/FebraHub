"use client";

import { SaleOrderFormView } from "@/features/sales-orders/components/sale-order-form-view";

/**
 * Mesmo formulário/layout/lógica de "Novo Pedido de Venda"
 * (`SaleOrderFormView`) — única diferença: Status trava em "Fechado", já que
 * uma venda em `/vendas` já nasce concluída.
 */
export function SaleCreatePage() {
  return (
    <SaleOrderFormView
      headerTitle="Nova Venda"
      headerSubtitle="Venda"
      backHref="/vendas"
      initialStatus="closed"
      statusLocked
      redirectPath="/vendas"
    />
  );
}
