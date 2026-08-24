import { MOCK_PROMOTIONS } from "@/features/promotions/data/mock-promotions";
import type {
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionListTab,
  PromotionTabCounts,
} from "@/features/promotions/types/promotion";

let promotionsStore: Promotion[] = MOCK_PROMOTIONS.map((promotion) => ({
  ...promotion,
}));

function matchesSearch(promotion: Promotion, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return promotion.name.toLowerCase().includes(q);
}

function computeTabCounts(all: readonly Promotion[]): PromotionTabCounts {
  return {
    active: all.filter((item) => item.deletedAt == null).length,
    deleted: all.filter((item) => item.deletedAt != null).length,
  };
}

function filterByTab(
  all: readonly Promotion[],
  tab: PromotionListTab,
): Promotion[] {
  return all.filter((item) =>
    tab === "deleted" ? item.deletedAt != null : item.deletedAt == null,
  );
}

export function listPromotions(
  params: PromotionListParams,
): PromotionListResult {
  const tabCounts = computeTabCounts(promotionsStore);

  const filtered = filterByTab(promotionsStore, params.tab).filter((item) =>
    matchesSearch(item, params.search),
  );

  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  const data = sorted.slice(start, start + params.perPage);

  return {
    data,
    meta: { total, page, perPage: params.perPage, totalPages },
    tabCounts,
  };
}

export function getPromotionById(id: string): Promotion | undefined {
  return promotionsStore.find((item) => item.id === id);
}

let createdCounter = 0;

/** Dados mínimos persistidos na lista ao criar uma promoção (mock UI). */
export type CreatePromotionInput = {
  name: string;
  type: Promotion["type"];
  /** ISO date/datetime de início. */
  startsAt: string;
  /** ISO date/datetime de término. */
  endsAt: string;
};

/**
 * Cria uma promoção no store mock e a devolve. Guarda apenas os campos-base
 * exibidos na listagem; a configuração completa da campanha é transiente.
 */
export function createPromotion(input: CreatePromotionInput): Promotion {
  createdCounter += 1;
  const promotion: Promotion = {
    id: `promo-new-${createdCounter}`,
    name: input.name,
    type: input.type,
    startsAt: toIsoDay(input.startsAt),
    endsAt: toIsoDay(input.endsAt),
    deletedAt: null,
  };
  promotionsStore = [promotion, ...promotionsStore];
  return promotion;
}

/**
 * Atualiza os campos-base de uma promoção existente no store mock e a devolve
 * (ou `undefined` se o id não existir).
 */
export function updatePromotion(
  id: string,
  input: CreatePromotionInput,
): Promotion | undefined {
  const current = promotionsStore.find((item) => item.id === id);
  if (!current) return undefined;

  const updated: Promotion = {
    ...current,
    name: input.name,
    type: input.type,
    startsAt: toIsoDay(input.startsAt),
    endsAt: toIsoDay(input.endsAt),
  };
  promotionsStore = promotionsStore.map((item) =>
    item.id === id ? updated : item,
  );
  return updated;
}

/** Mantém apenas a parte de data (`YYYY-MM-DD`) de um ISO date/datetime. */
function toIsoDay(iso: string): string {
  return iso.slice(0, 10);
}

export function softDeletePromotion(id: string): boolean {
  const index = promotionsStore.findIndex((item) => item.id === id);
  if (index < 0) return false;
  promotionsStore = promotionsStore.map((item) =>
    item.id === id
      ? { ...item, deletedAt: new Date().toISOString() }
      : item,
  );
  return true;
}

export function restorePromotion(id: string): boolean {
  const index = promotionsStore.findIndex((item) => item.id === id);
  if (index < 0) return false;
  promotionsStore = promotionsStore.map((item) =>
    item.id === id ? { ...item, deletedAt: null } : item,
  );
  return true;
}
