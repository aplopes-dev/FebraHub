import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportOpenBudgetsRepository } from '../../domain/repositories/report-open-budgets.repository';
import type {
  ListReportOpenBudgetsCriteria,
  ListReportOpenBudgetsResult,
  ReportOpenBudgetRow,
} from '../../domain/report-open-budgets.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function formatBudgetDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportOpenBudgetsRepository extends ReportOpenBudgetsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportOpenBudgetsCriteria,
  ): Promise<ListReportOpenBudgetsResult> {
    const dateGte = parseCivilDate(criteria.startDate);
    const dateLte = parseCivilDate(criteria.endDate);

    const where = {
      storeId,
      status: 'pending' as const,
      date: {
        gte: dateGte,
        lte: dateLte,
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          date: true,
          description: true,
          finalValueCents: true,
          patient: {
            select: {
              name: true,
              cpf: true,
              phone: true,
              email: true,
              guardianPhone: true,
            },
          },
        },
      }),
      this.prisma.budget.count({ where }),
    ]);

    const items: ReportOpenBudgetRow[] = rows.map((row) => ({
      id: row.id,
      budgetDate: formatBudgetDate(row.date),
      patientName: row.patient.name,
      document: row.patient.cpf ?? '',
      mobile: row.patient.phone ?? '',
      email: row.patient.email ?? '',
      responsibleMobile: row.patient.guardianPhone ?? '',
      description: row.description,
      status: 'pending',
      valueCents: row.finalValueCents,
    }));

    return { items, total };
  }
}
