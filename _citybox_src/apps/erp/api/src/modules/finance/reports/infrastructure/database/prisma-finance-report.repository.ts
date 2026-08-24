import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinanceReportRepository,
  type AllocationAggregate,
} from '../../domain/repositories/finance-report.repository.interface';

/**
 * Agregação real — sempre `groupBy` no Postgres sobre
 * `financial_entry_allocations`, nunca `findMany` + soma em memória. Ver
 * `specs/erp/003-financial-reports-cost-center/research.md` D3/D5.
 */
@Injectable()
export class PrismaFinanceReportRepository extends FinanceReportRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async sumAllocationsByChartOfAccount(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<Map<string, AllocationAggregate>> {
    const rows = await this.prisma.scoped.financialEntryAllocation.groupBy({
      by: ['chartOfAccountId'],
      where: {
        organizationId,
        financialEntry: {
          organizationId,
          deletedAt: null,
          competenceDate: { gte: from, lte: to },
        },
      },
      _sum: { amountCents: true },
      _count: true,
    });

    return new Map(
      rows.map((row) => [
        row.chartOfAccountId,
        { totalCents: row._sum.amountCents ?? 0, entryCount: row._count },
      ]),
    );
  }

  async sumAllocationsByCostCenter(
    organizationId: string,
    from: Date,
    to: Date,
    operation: 'payable' | 'receivable',
  ): Promise<Map<string, AllocationAggregate>> {
    const rows = await this.prisma.scoped.financialEntryAllocation.groupBy({
      by: ['costCenterId'],
      where: {
        organizationId,
        financialEntry: {
          organizationId,
          deletedAt: null,
          operation,
          competenceDate: { gte: from, lte: to },
        },
      },
      _sum: { amountCents: true },
      _count: true,
    });

    return new Map(
      rows.map((row) => [
        row.costCenterId,
        { totalCents: row._sum.amountCents ?? 0, entryCount: row._count },
      ]),
    );
  }
}
