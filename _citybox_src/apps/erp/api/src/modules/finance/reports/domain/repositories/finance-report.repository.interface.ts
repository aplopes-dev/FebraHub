/**
 * Agregado de rateio (`FinancialEntryAllocation`) por um eixo (conta do plano
 * ou centro de custo) — sempre calculado no banco (`groupBy`), nunca somando
 * linha a linha em memória. Ver
 * `specs/erp/003-financial-reports-cost-center/research.md` D3/D5.
 */
export type AllocationAggregate = {
  totalCents: number;
  entryCount: number;
};

export abstract class FinanceReportRepository {
  /** Chave do `Map` = `chartOfAccountId`. Usado pela DRE (income statement). */
  abstract sumAllocationsByChartOfAccount(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<Map<string, AllocationAggregate>>;

  /**
   * Chave do `Map` = `costCenterId`. Usado pela análise por centro de custo —
   * `operation` filtra `payable` (despesa) ou `receivable` (receita), ver
   * `research.md` D5.
   */
  abstract sumAllocationsByCostCenter(
    organizationId: string,
    from: Date,
    to: Date,
    operation: 'payable' | 'receivable',
  ): Promise<Map<string, AllocationAggregate>>;
}
