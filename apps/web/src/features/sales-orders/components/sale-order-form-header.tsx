"use client";

import { EntityFormHeader } from "@/components/ui/form";

type SaleOrderFormHeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
};

export function SaleOrderFormHeader({
  title = "Novo Pedido de Venda",
  subtitle = "Pedido",
  backHref = "/vendas/pedidos-de-venda",
}: SaleOrderFormHeaderProps) {
  return (
    <EntityFormHeader
      title={title}
      subtitle={subtitle}
      backHref={backHref}
    />
  );
}
