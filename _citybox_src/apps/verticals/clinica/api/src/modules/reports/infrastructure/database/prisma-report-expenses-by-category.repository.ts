import { Injectable } from '@nestjs/common';
import { buildExpenseByCategorySummary } from '../../../dashboard/application/utils/dashboard-expense-by-category.math';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportExpensesByCategoryRepository } from '../../domain/repositories/report-expenses-by-category.repository';
import type {
  ListReportExpensesByCategoryCriteria,
  ListReportExpensesByCategoryResult,
  ReportExpensesByCategoryRow,
} from '../../domain/report-expenses-by-category.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

@Injectable()
export class PrismaReportExpensesByCategoryRepository extends ReportExpensesByCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportExpensesByCategoryCriteria,
  ): Promise<ListReportExpensesByCategoryResult> {
    const paidAtGte = parseCivilDate(criteria.startDate);
    const paidAtLte = toInclusiveEnd(criteria.endDate);

    const rows = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        type: 'expense',
        status: 'paid',
        paidAt: {
          gte: paidAtGte,
          lte: paidAtLte,
        },
      },
      select: {
        valueCents: true,
        paidValueCents: true,
        expenseCategoryId: true,
        expenseCategory: { select: { id: true, name: true, color: true } },
      },
    });

    const summary = buildExpenseByCategorySummary(
      rows.map((row) => ({
        categoryId: row.expenseCategoryId,
        categoryName: row.expenseCategory?.name ?? null,
        categoryColor: row.expenseCategory?.color ?? null,
        amountCents: row.paidValueCents ?? row.valueCents,
      })),
    );

    const items: ReportExpensesByCategoryRow[] = summary.items
      .map((item) => ({
        id: item.categoryId,
        categoryName: item.label,
        valueCents: item.amountCents,
        percentage: item.percent,
      }))
      .sort((a, b) => {
        if (a.valueCents !== b.valueCents) {
          return b.valueCents - a.valueCents;
        }
        return a.categoryName.localeCompare(b.categoryName, 'pt-BR');
      });

    const total = items.length;
    const pageItems = items.slice(criteria.skip, criteria.skip + criteria.take);
    return { items: pageItems, total };
  }
}
