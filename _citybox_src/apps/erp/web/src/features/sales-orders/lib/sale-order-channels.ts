import type { SaleOrderChannelId } from "@/features/sales-orders/types/sale-order";

export const SALE_ORDER_CHANNEL_LABELS: Record<SaleOrderChannelId, string> = {
  pdv: "Ponto de venda",
  delivery: "Delivery",
  marketplace: "Marketplace",
  cardapio: "Cardápio digital",
};

export type PosDeliveryFulfillment = "delivery" | "pickup";

export function formatSaleOrderChannel(channelId: SaleOrderChannelId): string {
  return SALE_ORDER_CHANNEL_LABELS[channelId];
}

/** Entrega vs retirada quando o canal é delivery (vínculo PosDeliveryOrder). */
export function formatPosDeliveryFulfillment(
  fulfillment: PosDeliveryFulfillment | null | undefined,
): string | null {
  if (fulfillment === "delivery") return "Entrega";
  if (fulfillment === "pickup") return "Retirada";
  return null;
}

export function formatSaleOrderChannelWithFulfillment(
  channelId: SaleOrderChannelId,
  fulfillment?: PosDeliveryFulfillment | null,
): string {
  const base = formatSaleOrderChannel(channelId);
  const label = formatPosDeliveryFulfillment(fulfillment);
  if (channelId !== "delivery" || !label) return base;
  return `${base} · ${label}`;
}
