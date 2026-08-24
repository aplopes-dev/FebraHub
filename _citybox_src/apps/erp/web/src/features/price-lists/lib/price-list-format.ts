import { PRODUCT_CHANNEL_OPTIONS } from "@/features/products/data/mock-products";
import { computeAdjustedPrice } from "@/features/price-lists/lib/price-list-adjustment";
import {
  PRICE_ADJUSTMENT_LABELS,
  type PriceList,
} from "@/features/price-lists/types/price-list";

const CHANNEL_NAME_BY_ID = new Map(
  PRODUCT_CHANNEL_OPTIONS.map((channel) => [channel.id, channel.name]),
);

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function computePriceForProduct(base: number, list: PriceList): number {
  return computeAdjustedPrice(base, list);
}

export function formatAdjustmentRule(list: PriceList): string {
  switch (list.adjustmentType) {
    case "percent_markup":
      return `Acréscimo ${formatPercent(list.adjustmentValue)}`;
    case "percent_discount":
      return `Desconto ${formatPercent(list.adjustmentValue)}`;
    case "fixed_over_base":
      return `Valor fixo ${formatCurrency(list.adjustmentValue)}`;
    case "manual":
    default:
      return PRICE_ADJUSTMENT_LABELS.manual;
  }
}

export function formatChannelsSummary(list: PriceList): string {
  if (list.channels.length === 0) return "Todos os canais";

  const [firstId, ...rest] = list.channels;
  const firstName = CHANNEL_NAME_BY_ID.get(firstId) ?? firstId;
  if (rest.length === 0) return firstName;
  return `${firstName} +${rest.length}`;
}

export function getPriceListChannelLabels(list: PriceList): string[] {
  return list.channels.map((id) => CHANNEL_NAME_BY_ID.get(id) ?? id);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatValidity(list: PriceList): string {
  if (!list.startDate && !list.endDate) return "Sem prazo";
  if (list.startDate && list.endDate) {
    return `${formatDate(list.startDate)} – ${formatDate(list.endDate)}`;
  }
  if (list.startDate) return `A partir de ${formatDate(list.startDate)}`;
  return `Até ${formatDate(list.endDate as string)}`;
}
