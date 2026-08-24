import {
  FinanceReportRepository,
  type AllocationAggregate,
} from '../domain/repositories/finance-report.repository.interface';

export type InMemoryAllocationRow = {
  organizationId: string;
  chartOfAccountId: string;
  costCenterId: string;
  amountCents: number;
  competenceDate: Date;
  deletedAt: Date | null;
  operation: 'payable' | 'receivable';
};

/**
 * Replica em memória a mesma lógica de agregação do `groupBy` real — usado
 * pelos `.spec.ts` dos use cases de relatório, nunca em produção.
 */
export class InMemoryFinanceReportRepository extends FinanceReportRepository {
  readonly allocations: InMemoryAllocationRow[] = [];

  addAllocation(input: InMemoryAllocationRow): void {
    this.allocations.push(input);
  }

  private inRange(
    row: InMemoryAllocationRow,
    organizationId: string,
    from: Date,
    to: Date,
  ): boolean {
    return (
      row.organizationId === organizationId &&
      row.deletedAt === null &&
      row.competenceDate.getTime() >= from.getTime() &&
      row.competenceDate.getTime() <= to.getTime()
    );
  }

  private reduceBy(
    rows: InMemoryAllocationRow[],
    keyOf: (row: InMemoryAllocationRow) => string,
  ): Map<string, AllocationAggregate> {
    const result = new Map<string, AllocationAggregate>();
    for (const row of rows) {
      const key = keyOf(row);
      const current = result.get(key) ?? { totalCents: 0, entryCount: 0 };
      result.set(key, {
        totalCents: current.totalCents + row.amountCents,
        entryCount: current.entryCount + 1,
      });
    }
    return result;
  }

  sumAllocationsByChartOfAccount(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<Map<string, AllocationAggregate>> {
    const rows = this.allocations.filter((row) =>
      this.inRange(row, organizationId, from, to),
    );
    return Promise.resolve(this.reduceBy(rows, (row) => row.chartOfAccountId));
  }

  sumAllocationsByCostCenter(
    organizationId: string,
    from: Date,
    to: Date,
    operation: 'payable' | 'receivable',
  ): Promise<Map<string, AllocationAggregate>> {
    const rows = this.allocations.filter(
      (row) =>
        this.inRange(row, organizationId, from, to) &&
        row.operation === operation,
    );
    return Promise.resolve(this.reduceBy(rows, (row) => row.costCenterId));
  }
}
