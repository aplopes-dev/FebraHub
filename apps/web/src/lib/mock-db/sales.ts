import { findProduct } from "@/lib/mock-db/catalog";
import { createRandom, isoFromNow, seqId } from "@/lib/mock-db/lcg";
import { PEOPLE } from "@/lib/mock-db/people";
import { OPPORTUNITIES } from "@/lib/mock-db/pipeline";
import type {
  CommercialStatus,
  FinancialStatus,
  Opportunity,
  Sale,
  SaleInstallment,
} from "@/lib/mock-db/types";

/**
 * Vendas — o registro comercial do que foi fechado.
 *
 * Duas separações que o resto do sistema depende e que aqui já nascem certas:
 *
 * - **Comprador ≠ beneficiário.** Empresa que compra para o time, pai que
 *   paga o curso do filho: quem paga e quem cursa são pessoas diferentes.
 * - **Status comercial ≠ status financeiro.** "Aprovada" diz que a venda
 *   vale; quem diz se o dinheiro entrou é o Financeiro. Misturar os dois é o
 *   jeito mais rápido de contar como receita o que nunca virou caixa.
 */

function buildInstallments(
  random: ReturnType<typeof createRandom>,
  netCents: number,
  downPaymentCents: number,
  count: number,
  createdAt: string,
  financialStatus: FinancialStatus,
): SaleInstallment[] {
  const financedCents = Math.max(0, netCents - downPaymentCents);
  const base = count > 0 ? Math.floor(financedCents / count) : 0;
  const plan: SaleInstallment[] = [];
  const start = new Date(createdAt).getTime();

  for (let index = 0; index < count; index += 1) {
    const isLast = index === count - 1;
    const amountCents = isLast ? financedCents - base * (count - 1) : base;
    const dueAt = new Date(start + (index + 1) * 30 * 86_400_000).toISOString();
    const due = new Date(dueAt).getTime();
    const now = new Date(isoFromNow(0)).getTime();

    let status: SaleInstallment["status"] = "aberta";
    if (financialStatus === "quitado") status = "paga";
    else if (financialStatus === "estornado") status = "estornada";
    else if (due < now) {
      status = financialStatus === "inadimplente" ? "vencida" : "paga";
    }

    plan.push({
      number: index + 1,
      dueAt,
      amountCents,
      status,
      paidAt: status === "paga" ? dueAt : undefined,
    });
  }

  return plan;
}

function build(): Sale[] {
  const random = createRandom(555_123);
  const sales: Sale[] = [];
  const won = OPPORTUNITIES.filter((opportunity) => opportunity.status === "ganha");

  won.forEach((opportunity, index) => {
    const product = findProduct(opportunity.productId);
    const listPriceCents = opportunity.proposal?.listPriceCents ?? product?.listPriceCents ?? 0;
    const netCents = opportunity.proposal?.netCents ?? opportunity.amountCents;
    const discountCents = Math.max(0, listPriceCents - netCents);
    const installments = opportunity.proposal?.installments ?? 1;
    const downPaymentCents = opportunity.proposal?.downPaymentCents ?? netCents;
    const createdAt = opportunity.closedAt ?? opportunity.stageChangedAt;

    const commercialRoll = random.next();
    const commercialStatus: CommercialStatus =
      commercialRoll < 0.82
        ? "aprovada"
        : commercialRoll < 0.94
          ? "aguardando_aprovacao"
          : "cancelada";

    const financialRoll = random.next();
    const financialStatus: FinancialStatus =
      commercialStatus === "cancelada"
        ? "estornado"
        : financialRoll < 0.34
          ? "quitado"
          : financialRoll < 0.74
            ? "parcial"
            : financialRoll < 0.9
              ? "pendente"
              : "inadimplente";

    const year = new Date(createdAt).getUTCFullYear();
    const sale: Sale = {
      id: seqId("sal", index + 1),
      number: `VND-${year}-${String(index + 1).padStart(4, "0")}`,
      opportunityId: opportunity.id,
      buyerId: opportunity.personId,
      beneficiaryId: undefined,
      productId: opportunity.productId,
      editionId: opportunity.editionId,
      sellerId: opportunity.ownerId,
      referrerId: random.chance(0.3) ? random.pick(["usr-bia", "usr-lucas"]) : undefined,
      listPriceCents,
      discountCents,
      netCents,
      downPaymentCents,
      installments,
      paymentMethod: opportunity.proposal?.paymentMethod ?? "pix",
      commercialStatus,
      financialStatus,
      origin: opportunity.origin,
      createdAt,
      approvedAt: commercialStatus === "aprovada" ? createdAt : undefined,
      approvedById: commercialStatus === "aprovada" ? "usr-dulce" : undefined,
      canceledAt: commercialStatus === "cancelada" ? isoFromNow(-random.int(1, 20)) : undefined,
      cancelReason:
        commercialStatus === "cancelada"
          ? random.pick([
              "Desistência dentro do prazo de arrependimento",
              "Cartão não autorizado após três tentativas",
              "Aluno transferido para a turma seguinte",
            ])
          : undefined,
      installmentsPlan: buildInstallments(
        random,
        netCents,
        downPaymentCents,
        installments,
        createdAt,
        financialStatus,
      ),
    };

    // Compra para terceiro: acontece bastante em turma corporativa.
    if (random.chance(0.12)) {
      sale.beneficiaryId = undefined;
    }

    sales.push(sale);
    opportunity.saleId = sale.id;
  });

  return sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Vendas antigas — 14 meses de histórico.
 *
 * Sem elas o painel do comercial não tem o que mostrar: evolução de
 * faturamento, comparação com o ano anterior e a escada de recompra da pessoa
 * só existem se houver passado. Estas vendas **não têm oportunidade**, e isso
 * é honesto: elas são anteriores ao CRM.
 */
function buildHistory(): Sale[] {
  const random = createRandom(77_003);
  const sales: Sale[] = [];
  const sellers = ["usr-tati", "usr-marcos", "usr-juliana", "usr-rafael"];
  // Produtos que a unidade vende de verdade, com peso: imersão puxa volume,
  // formação puxa valor.
  const catalog = [
    "prd-if", "prd-if", "prd-if",
    "prd-cis", "prd-cis", "prd-cis", "prd-cis",
    "prd-vsri", "prd-vsri",
    "prd-tav", "prd-bhp", "prd-assessment",
    "prd-fcis", "prd-fcis",
    "prd-green", "prd-golden", "prd-coaching",
  ];

  let index = 0;
  for (let monthsAgo = 25; monthsAgo >= 1; monthsAgo -= 1) {
    // Volume cresce devagar ao longo do tempo e some picos em mês de turma
    // grande — é o que dá forma à barra da evolução.
    const spike = monthsAgo % 6 === 2;
    const count = random.int(4, 9) + (spike ? random.int(3, 6) : 0);

    for (let i = 0; i < count; i += 1) {
      index += 1;
      const productId = random.pick(catalog);
      const product = findProduct(productId);
      const listPriceCents = product?.listPriceCents ?? 0;
      const discountPercent = random.int(0, product?.maxDiscountPercent ?? 10);
      const discountCents = Math.round((listPriceCents * discountPercent) / 100);
      const netCents = listPriceCents - discountCents;
      const installments = random.pick([1, 3, 6, 10, 12]);
      const downPaymentCents =
        installments === 1 ? netCents : Math.round(netCents * random.pick([0.1, 0.2, 0.3]));
      const createdAt = isoFromNow(-(monthsAgo * 30 + random.int(0, 27)), -random.int(1, 20));
      const person = random.pick(PEOPLE);

      const financialStatus: FinancialStatus =
        monthsAgo > 12
          ? "quitado"
          : random.next() < 0.72
            ? "quitado"
            : random.next() < 0.7
              ? "parcial"
              : "inadimplente";

      sales.push({
        id: seqId("sah", index),
        number: `VND-${new Date(createdAt).getUTCFullYear()}-${String(9000 + index)}`,
        buyerId: person.id,
        productId,
        sellerId: random.pick(sellers),
        listPriceCents,
        discountCents,
        netCents,
        downPaymentCents,
        installments,
        paymentMethod: random.pick(["pix", "cartao_credito", "boleto"]),
        commercialStatus: random.next() < 0.96 ? "aprovada" : "cancelada",
        financialStatus,
        origin: person.origin,
        createdAt,
        approvedAt: createdAt,
        approvedById: "usr-dulce",
        installmentsPlan: buildInstallments(
          random,
          netCents,
          downPaymentCents,
          installments,
          createdAt,
          financialStatus,
        ),
      });
    }
  }

  return sales;
}

/** Store mutável: a tela do funil fecha venda e ela aparece aqui. */
export const SALES: Sale[] = [...build(), ...buildHistory()].sort((a, b) =>
  b.createdAt.localeCompare(a.createdAt),
);

export function findSale(id: string | undefined): Sale | undefined {
  if (!id) return undefined;
  return SALES.find((sale) => sale.id === id);
}

export function salesOfPerson(personId: string): Sale[] {
  return SALES.filter(
    (sale) => sale.buyerId === personId || sale.beneficiaryId === personId,
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function salesOfEdition(editionId: string): Sale[] {
  return SALES.filter((sale) => sale.editionId === editionId);
}

/**
 * Cria a venda a partir de uma oportunidade ganha. Espelha o que o backend
 * fará: a venda nasce **aguardando aprovação** e o status financeiro começa
 * pendente — nada aqui decide que o dinheiro entrou.
 */
export function createSaleFromOpportunity(opportunity: Opportunity): Sale {
  const product = findProduct(opportunity.productId);
  const listPriceCents =
    opportunity.proposal?.listPriceCents ?? product?.listPriceCents ?? opportunity.amountCents;
  const netCents = opportunity.proposal?.netCents ?? opportunity.amountCents;
  const installments = opportunity.proposal?.installments ?? 1;
  const downPaymentCents = opportunity.proposal?.downPaymentCents ?? netCents;
  const createdAt = isoFromNow(0);
  const random = createRandom(SALES.length + 7_919);

  const sale: Sale = {
    id: seqId("sal", SALES.length + 1),
    number: `VND-${new Date(createdAt).getUTCFullYear()}-${String(SALES.length + 1).padStart(4, "0")}`,
    opportunityId: opportunity.id,
    buyerId: opportunity.personId,
    productId: opportunity.productId,
    editionId: opportunity.editionId,
    sellerId: opportunity.ownerId,
    listPriceCents,
    discountCents: Math.max(0, listPriceCents - netCents),
    netCents,
    downPaymentCents,
    installments,
    paymentMethod: opportunity.proposal?.paymentMethod ?? "pix",
    commercialStatus: "aguardando_aprovacao",
    financialStatus: "pendente",
    origin: opportunity.origin,
    createdAt,
    installmentsPlan: buildInstallments(
      random,
      netCents,
      downPaymentCents,
      installments,
      createdAt,
      "pendente",
    ),
  };

  SALES.unshift(sale);
  return sale;
}
