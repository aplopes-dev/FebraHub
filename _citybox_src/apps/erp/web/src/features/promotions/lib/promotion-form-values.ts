import type { Promotion } from "@/features/promotions/types/promotion";
import type {
  GiftItem,
  ProgressiveTier,
  PromotionFormValues,
} from "@/features/promotions/types/promotion-form";

let idCounter = 0;

/** Gera um id local estável para linhas de faixa/brinde (mock UI). */
export function createLocalId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** Converte ISO `YYYY-MM-DD` em `Date` local (meio-dia evita fuso). */
export function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

/** Converte `Date` em ISO `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createEmptyProgressiveTier(): ProgressiveTier {
  return {
    id: createLocalId("tier"),
    fromQty: 0,
    toQty: 0,
    unitValue: 0,
  };
}

export function createEmptyGiftItem(): GiftItem {
  return {
    id: createLocalId("gift"),
    productId: "",
    quantity: 1,
  };
}

/**
 * Converte uma promoção do store nos valores do formulário (edição). O store
 * mock guarda só nome/tipo/período — as regras detalhadas voltam ao default.
 */
export function promotionToFormValues(
  promotion: Promotion,
): PromotionFormValues {
  const base = createEmptyPromotionFormValues();
  return {
    ...base,
    type: promotion.type,
    general: {
      ...base.general,
      name: promotion.name,
      startDate: promotion.startsAt,
      endDate: promotion.endsAt,
    },
  };
}

export function createEmptyPromotionFormValues(): PromotionFormValues {
  return {
    type: null,
    general: {
      name: "",
      description: "",
      startDate: "",
      startTime: "00:00",
      endDate: "",
      endTime: "23:59",
      cumulative: false,
      optional: false,
      identifiedCustomersOnly: false,
      unitIds: [],
      restrictionMode: "none",
      weekdays: [],
    },
    rules: {
      productIds: [],
      categoryIds: [],
      conditionScope: "any_product",
      considerVariations: false,

      triggerQuantity: 0,
      totalToPay: 0,
      allowMultiple: false,

      tiers: [createEmptyProgressiveTier()],

      couponName: "",
      couponQuantity: 1,
      autoNumbering: true,
      couponDiscountKind: "percentage",
      couponPercentage: 0,
      couponFixed: 0,
      couponApplyTarget: "sale_total",

      minAmount: 0,
      minQuantity: 0,
      discountKind: "percentage",
      discountPercentage: 0,
      discountFixed: 0,
      discountApplyTarget: "sale_total",

      allowMultipleGifts: false,
      giftLimitMode: "per_gift_product",
      gifts: [createEmptyGiftItem()],
      maxTotalGifts: 1,
    },
  };
}
