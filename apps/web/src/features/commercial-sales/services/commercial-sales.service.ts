import {
  SALES,
  findConsultant,
  findEdition,
  findPerson,
  findProduct,
  type Sale,
} from "@/lib/mock-db";
import { discountPercent } from "@/lib/money";
import type {
  CommercialSaleRow,
  SalesBoard,
  SalesFilters,
  SalesTab,
} from "@/features/commercial-sales/types/sale-view";

/**
 * Vendas do comercial.
 *
 * O que esta tela nunca faz: dizer que a venda "entrou". Status comercial e
 * status financeiro andam em colunas separadas porque quem aprova a venda é o
 * comercial e quem confirma o dinheiro é o financeiro — juntar os dois é como
 * a receita vira maior que o caixa.
 */

function toRow(sale: Sale): CommercialSaleRow {
  const seller = findConsultant(sale.sellerId);
  const paidCents = sale.installmentsPlan
    .filter((installment) => installment.status === "paga")
    .reduce((total, installment) => total + installment.amountCents, 0);

  return {
    sale,
    buyerName: findPerson(sale.buyerId)?.name ?? "—",
    beneficiaryName: sale.beneficiaryId
      ? findPerson(sale.beneficiaryId)?.name
      : undefined,
    productName: findProduct(sale.productId)?.shortName ?? "—",
    editionName: findEdition(sale.editionId)?.name,
    sellerName: seller?.name ?? "—",
    sellerInitials: seller?.initials ?? "—",
    discountPercent: discountPercent(sale.listPriceCents, sale.netCents),
    paidCents,
    overdueCount: sale.installmentsPlan.filter(
      (installment) => installment.status === "vencida",
    ).length,
  };
}

export function getSalesBoard(filters: SalesFilters): SalesBoard {
  const all = SALES.map(toRow);
  const term = filters.search.trim().toLowerCase();

  const rows = all.filter((row) => {
    if (filters.tab !== "todas" && row.sale.commercialStatus !== filters.tab) return false;
    if (filters.financial !== "todos" && row.sale.financialStatus !== filters.financial) {
      return false;
    }
    if (term) {
      const matches =
        row.buyerName.toLowerCase().includes(term) ||
        row.sale.number.toLowerCase().includes(term) ||
        row.productName.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

  const tabCounts: Record<SalesTab, number> = {
    todas: all.length,
    aguardando_aprovacao: all.filter(
      (row) => row.sale.commercialStatus === "aguardando_aprovacao",
    ).length,
    aprovada: all.filter((row) => row.sale.commercialStatus === "aprovada").length,
    cancelada: all.filter((row) => row.sale.commercialStatus === "cancelada").length,
  };

  const valid = all.filter((row) => row.sale.commercialStatus !== "cancelada");
  const netCents = valid.reduce((total, row) => total + row.sale.netCents, 0);
  const listCents = valid.reduce((total, row) => total + row.sale.listPriceCents, 0);

  return {
    rows: rows.sort((a, b) => b.sale.createdAt.localeCompare(a.sale.createdAt)),
    tabCounts,
    summary: {
      netCents,
      listCents,
      discountPercent: discountPercent(listCents, netCents),
      awaitingApproval: tabCounts.aguardando_aprovacao,
      overdue: all.filter((row) => row.overdueCount > 0).length,
    },
  };
}

export function getSaleRow(saleId: string): CommercialSaleRow | undefined {
  const sale = SALES.find((item) => item.id === saleId);
  return sale ? toRow(sale) : undefined;
}
