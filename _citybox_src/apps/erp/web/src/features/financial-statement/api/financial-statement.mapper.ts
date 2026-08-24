import { centsToReais } from "@/features/financial-entries/api/financial-entry.mapper";
import type { FinancialStatementSummaryDto } from "@/features/financial-statement/api/financial-statement.dto";
import type {
  FinancialStatementListParams,
  FinancialStatementSummary,
} from "@/features/financial-statement/types/financial-statement";

export function toFinancialStatementSummary(
  dto: FinancialStatementSummaryDto,
): FinancialStatementSummary {
  return {
    receivable: centsToReais(dto.receivableCents),
    payable: centsToReais(dto.payableCents),
    net: centsToReais(dto.netCents),
  };
}

/**
 * Monta os parâmetros de filtro comuns à listagem e ao resumo do extrato —
 * usada pelos dois endpoints em `financial-statement.service.ts`, para não
 * duplicar a lógica do eixo de data (`research.md` D2/D5 de
 * `004-financial-statement`).
 */
export function buildFinancialStatementQuery(
  params: Pick<FinancialStatementListParams, "search" | "filters">,
): URLSearchParams {
  const { search, filters } = params;
  const query = new URLSearchParams();

  if (search.trim()) query.set("search", search.trim());
  if (filters.operations.length === 1) {
    query.set("operation", filters.operations[0]!);
  }
  for (const status of filters.statuses) query.append("status", status);
  for (const id of filters.categoryIds) query.append("chartOfAccountId", id);
  for (const id of filters.costCenterIds) query.append("costCenterId", id);
  if (filters.bankAccountId) query.set("bankAccountId", filters.bankAccountId);

  // Eixo de data: só um dos dois pares é enviado por vez — nunca os dois
  // juntos (o backend aceitaria ambos, mas o frontend decide qual eixo o
  // operador está filtrando).
  if (filters.dateFrom || filters.dateTo) {
    const fromKey = filters.dateAxis === "due" ? "dueFrom" : "competenceFrom";
    const toKey = filters.dateAxis === "due" ? "dueTo" : "competenceTo";
    if (filters.dateFrom) query.set(fromKey, filters.dateFrom);
    if (filters.dateTo) query.set(toKey, filters.dateTo);
  }

  return query;
}
