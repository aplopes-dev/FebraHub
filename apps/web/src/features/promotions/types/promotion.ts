export type PromotionType =
  | "gift_by_quantity"
  | "discount_by_quantity"
  | "gift_by_amount"
  | "discount_by_amount"
  | "discount_coupon"
  | "progressive_discount"
  | "buy_more_pay_less";

export type PromotionStatus = "scheduled" | "active" | "ended";

export type PromotionListTab = "active" | "deleted";

export type Promotion = {
  id: string;
  name: string;
  type: PromotionType;
  /** Data de início (ISO date `YYYY-MM-DD`). */
  startsAt: string;
  /** Data de fim (ISO date `YYYY-MM-DD`). */
  endsAt: string;
  deletedAt: string | null;
};

export type PromotionTabCounts = Record<PromotionListTab, number>;

export type PromotionListParams = {
  tab: PromotionListTab;
  search: string;
  page: number;
  perPage: number;
};

export type PromotionListResult = {
  data: Promotion[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: PromotionTabCounts;
};

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  gift_by_quantity: "Brinde por quantidade",
  discount_by_quantity: "Desconto por quantidade",
  gift_by_amount: "Brinde por valor",
  discount_by_amount: "Desconto por valor",
  discount_coupon: "Cupom de desconto",
  progressive_discount: "Desconto progressivo",
  buy_more_pay_less: "Leve mais pague menos",
};

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  scheduled: "Agendada",
  active: "Ativa",
  ended: "Encerrada",
};

export const PROMOTION_TAB_LABELS: Record<PromotionListTab, string> = {
  active: "Ativas",
  deleted: "Excluídas",
};

export const PROMOTION_TAB_ORDER: PromotionListTab[] = ["active", "deleted"];

/** Compara datas ISO `YYYY-MM-DD` (sem horário). */
export function resolvePromotionStatus(
  promotion: Pick<Promotion, "startsAt" | "endsAt">,
  today = new Date(),
): PromotionStatus {
  const todayKey = toDateKey(today);
  if (todayKey < promotion.startsAt) return "scheduled";
  if (todayKey > promotion.endsAt) return "ended";
  return "active";
}

export function formatPromotionPeriod(
  startsAt: string,
  endsAt: string,
): string {
  return `${formatIsoDate(startsAt)} – ${formatIsoDate(endsAt)}`;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}
