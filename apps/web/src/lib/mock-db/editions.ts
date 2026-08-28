import { isoFromNow } from "@/lib/mock-db/lcg";
import type { Edition } from "@/lib/mock-db/types";

/**
 * As edições da praça — o produto **datado**.
 *
 * É a edição que fatura, não o produto: mesma marca, instrutor diferente,
 * lote diferente e praça diferente dão resultados que não se comparam. Por
 * isso toda métrica de conversão do módulo é por coorte de edição.
 *
 * As datas são relativas à âncora do `mock-db` (`lcg.ts`): há edições
 * encerradas para dar histórico, uma **em andamento** (é nela que a operação de
 * sala roda) e edições futuras com venda aberta.
 */
export const EDITIONS: Edition[] = [
  {
    id: "edi-if-ago",
    productId: "prd-if",
    name: "Imersão Inteligência Financeira — Salvador",
    startsAt: isoFromNow(0, -6),
    endsAt: isoFromNow(2, 4),
    city: "Salvador",
    venue: "Centro de Convenções — Pituba",
    instructor: "Dulce Mariano",
    capacity: 320,
    status: "em_andamento",
    tiers: [
      { id: "tie-if-bronze", name: "Bronze", priceCents: 34_700, capacity: 200, sold: 62 },
      { id: "tie-if-black", name: "Black", priceCents: 89_700, capacity: 90, sold: 28 },
      { id: "tie-if-diamond", name: "Diamond", priceCents: 189_700, capacity: 30, sold: 10 },
    ],
  },
  {
    id: "edi-pda-set",
    productId: "prd-pda",
    name: "O Poder da Ação — palestra de abertura",
    startsAt: isoFromNow(12, -8),
    endsAt: isoFromNow(12, -4),
    city: "Salvador",
    venue: "Auditório Febracis Bahia — Pituba",
    instructor: "Tatiane Ribeiro",
    capacity: 180,
    status: "vendas_abertas",
    tiers: [
      { id: "tie-pda-inteira", name: "Inteira", priceCents: 4_700, capacity: 180, sold: 96 },
    ],
  },
  {
    id: "edi-cis-out",
    productId: "prd-cis",
    name: "Método CIS — Turma 251",
    startsAt: isoFromNow(38, -9),
    endsAt: isoFromNow(41, 6),
    city: "Salvador",
    venue: "Centro de Convenções — Pituba",
    instructor: "Paulo Vieira",
    capacity: 600,
    status: "vendas_abertas",
    tiers: [
      { id: "tie-cis-bronze", name: "Bronze", priceCents: 349_700, capacity: 380, sold: 142 },
      { id: "tie-cis-black", name: "Black", priceCents: 599_700, capacity: 170, sold: 58 },
      { id: "tie-cis-diamond", name: "Diamond", priceCents: 999_700, capacity: 50, sold: 11 },
    ],
  },
  {
    id: "edi-vsri-set",
    productId: "prd-vsri",
    name: "Viva sua Real Identidade — Salvador",
    startsAt: isoFromNow(24, -8),
    endsAt: isoFromNow(26, 5),
    city: "Salvador",
    venue: "Auditório Febracis Bahia — Pituba",
    instructor: "Juliana Carvalho",
    capacity: 220,
    status: "vendas_abertas",
    tiers: [
      { id: "tie-vsri-bronze", name: "Bronze", priceCents: 199_700, capacity: 150, sold: 44 },
      { id: "tie-vsri-black", name: "Black", priceCents: 349_700, capacity: 70, sold: 12 },
    ],
  },
  {
    id: "edi-tav-nov",
    productId: "prd-tav",
    name: "Técnicas Avançadas de Vendas — turma corporativa",
    startsAt: isoFromNow(62, -9),
    endsAt: isoFromNow(63, 5),
    city: "Salvador",
    venue: "Sala de treinamento — Febracis Bahia",
    instructor: "Marcos Andrade",
    capacity: 60,
    status: "planejada",
    tiers: [
      { id: "tie-tav-inteira", name: "Inteira", priceCents: 249_700, capacity: 60, sold: 7 },
    ],
  },
  {
    id: "edi-if-jun",
    productId: "prd-if",
    name: "Imersão Inteligência Financeira — junho",
    startsAt: isoFromNow(-72, -6),
    endsAt: isoFromNow(-70, 4),
    city: "Salvador",
    venue: "Centro de Convenções — Pituba",
    instructor: "Dulce Mariano",
    capacity: 300,
    status: "encerrada",
    tiers: [
      { id: "tie-ifjun-bronze", name: "Bronze", priceCents: 29_700, capacity: 190, sold: 181 },
      { id: "tie-ifjun-black", name: "Black", priceCents: 79_700, capacity: 80, sold: 74 },
      { id: "tie-ifjun-diamond", name: "Diamond", priceCents: 169_700, capacity: 30, sold: 22 },
    ],
  },
  {
    id: "edi-cis-jul",
    productId: "prd-cis",
    name: "Método CIS — Turma 248",
    startsAt: isoFromNow(-46, -9),
    endsAt: isoFromNow(-43, 6),
    city: "Salvador",
    venue: "Centro de Convenções — Pituba",
    instructor: "Paulo Vieira",
    capacity: 600,
    status: "encerrada",
    tiers: [
      { id: "tie-cisjul-bronze", name: "Bronze", priceCents: 329_700, capacity: 380, sold: 358 },
      { id: "tie-cisjul-black", name: "Black", priceCents: 579_700, capacity: 170, sold: 149 },
      { id: "tie-cisjul-diamond", name: "Diamond", priceCents: 979_700, capacity: 50, sold: 34 },
    ],
  },
];

/** A edição que está acontecendo agora — a que a operação de sala abre. */
export const LIVE_EDITION_ID = "edi-if-ago";

export function findEdition(id: string | undefined): Edition | undefined {
  if (!id) return undefined;
  return EDITIONS.find((edition) => edition.id === id);
}

export function findTier(editionId: string, tierId: string) {
  return findEdition(editionId)?.tiers.find((tier) => tier.id === tierId);
}

/** Ingressos vendidos na edição (soma dos lotes). */
export function editionSold(edition: Edition): number {
  return edition.tiers.reduce((total, tier) => total + tier.sold, 0);
}

/** Receita bruta de ingresso da edição, em centavos. */
export function editionTicketRevenueCents(edition: Edition): number {
  return edition.tiers.reduce(
    (total, tier) => total + tier.sold * tier.priceCents,
    0,
  );
}

/** Próximas edições com venda aberta, da mais próxima para a mais distante. */
export function upcomingEditions(): Edition[] {
  return EDITIONS.filter(
    (edition) => edition.status === "vendas_abertas" || edition.status === "planejada",
  ).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
