import type { PromotionType } from "@/features/promotions/types/promotion";

/** Etapas do formulário de criação de promoção. */
export type PromotionStep = "type" | "general" | "rules";

export const PROMOTION_STEP_ORDER: PromotionStep[] = [
  "type",
  "general",
  "rules",
];

export const PROMOTION_STEP_LABELS: Record<PromotionStep, string> = {
  type: "Selecionar promoção",
  general: "Informações gerais",
  rules: "Regras finais",
};

/** Como a promoção fica restrita (Etapa 2). */
export type PromotionRestrictionMode =
  | "none"
  | "specific_weekdays"
  | "customer_birthday_month";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAY_ORDER: Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Seg",
  tue: "Ter",
  wed: "Qua",
  thu: "Qui",
  fri: "Sex",
  sat: "Sáb",
  sun: "Dom",
};

/** Percentual ou valor fixo. */
export type DiscountKind = "percentage" | "fixed";

/** Onde o desconto incide. */
export type DiscountApplyTarget = "sale_total" | "specific_product";

/** Sobre o que a condição de gatilho observa. */
export type ConditionScope = "any_product" | "specific_products_or_categories";

/** Como o cupom aplica o desconto. */
export type CouponApplyTarget = "sale_total" | "specific_products";

/** Como o limite de brindes é contado. */
export type GiftLimitMode = "per_gift_product" | "total_units";

/** Uma faixa do desconto progressivo (De → Até → valor unitário). */
export type ProgressiveTier = {
  id: string;
  fromQty: number;
  toQty: number;
  unitValue: number;
};

/** Um item de brinde configurado na promoção. */
export type GiftItem = {
  id: string;
  productId: string;
  quantity: number;
};

/** Bloco compartilhado por todos os tipos — Etapa 2. */
export type PromotionGeneralConfig = {
  name: string;
  description: string;
  /** Data de início ISO `YYYY-MM-DD`. */
  startDate: string;
  /** Hora de início `HH:mm`. */
  startTime: string;
  /** Data de término ISO `YYYY-MM-DD`. */
  endDate: string;
  /** Hora de término `HH:mm`. */
  endTime: string;
  cumulative: boolean;
  optional: boolean;
  identifiedCustomersOnly: boolean;
  unitIds: string[];
  restrictionMode: PromotionRestrictionMode;
  weekdays: Weekday[];
};

/**
 * Regras da Etapa 3 — bloco "achatado": cada tipo de promoção usa apenas os
 * campos relevantes. Mantém o form-state simples sem uma união discriminada
 * profunda (padrão de mock UI já usado em outras features do ERP).
 */
export type PromotionRules = {
  // Escopo (produtos / categorias) — usado por vários tipos.
  productIds: string[];
  categoryIds: string[];
  conditionScope: ConditionScope;
  considerVariations: boolean;

  // buy_more_pay_less
  triggerQuantity: number;
  totalToPay: number;
  allowMultiple: boolean;

  // progressive_discount
  tiers: ProgressiveTier[];

  // discount_coupon
  couponName: string;
  couponQuantity: number;
  autoNumbering: boolean;
  couponDiscountKind: DiscountKind;
  couponPercentage: number;
  couponFixed: number;
  couponApplyTarget: CouponApplyTarget;

  // discount_by_amount / discount_by_quantity
  minAmount: number;
  minQuantity: number;
  discountKind: DiscountKind;
  discountPercentage: number;
  discountFixed: number;
  discountApplyTarget: DiscountApplyTarget;

  // gift_by_amount / gift_by_quantity
  allowMultipleGifts: boolean;
  giftLimitMode: GiftLimitMode;
  gifts: GiftItem[];
  maxTotalGifts: number;
};

export type PromotionFormValues = {
  type: PromotionType | null;
  general: PromotionGeneralConfig;
  rules: PromotionRules;
};
