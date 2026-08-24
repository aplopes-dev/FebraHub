import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportRejectedBudgetsRepository } from '../../domain/repositories/report-rejected-budgets.repository';
import type {
  ListReportRejectedBudgetsCriteria,
  ListReportRejectedBudgetsResult,
  ReportRejectedBudgetRow,
} from '../../domain/report-rejected-budgets.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function formatBudgetDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportRejectedBudgetsRepository extends ReportRejectedBudgetsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportRejectedBudgetsCriteria,
  ): Promise<ListReportRejectedBudgetsResult> {
    const rangeStart = parseCivilDate(criteria.startDate);
    const rangeEnd = parseCivilDate(criteria.endDate);

    // Preferência: rejectedAt no período. Fallback: rejectedAt nulo + Budget.date
    // (legado / dados sem data de reprovação preenchida).
    const where = {
      storeId,
      status: 'rejected' as const,
      OR: [
        {
          rejectedAt: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        {
          AND: [
            { rejectedAt: null },
            {
              date: {
                gte: rangeStart,
                lte: rangeEnd,
              },
            },
          ],
        },
      ],
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

    const items: ReportRejectedBudgetRow[] = rows.map((row) => ({
      id: row.id,
      budgetDate: formatBudgetDate(row.date),
      patientName: row.patient.name,
      document: row.patient.cpf ?? '',
      mobile: row.patient.phone ?? '',
      email: row.patient.email ?? '',
      responsibleMobile: row.patient.guardianPhone ?? '',
      description: row.description,
      status: 'rejected',
      valueCents: row.finalValueCents,
    }));

    return { items, total };
  }
}
