import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportApprovedBudgetsRepository } from '../../domain/repositories/report-approved-budgets.repository';
import type {
  ListReportApprovedBudgetsCriteria,
  ListReportApprovedBudgetsResult,
  ReportApprovedBudgetRow,
} from '../../domain/report-approved-budgets.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatBudgetDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportApprovedBudgetsRepository extends ReportApprovedBudgetsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportApprovedBudgetsCriteria,
  ): Promise<ListReportApprovedBudgetsResult> {
    const approvedAtGte = parseCivilDate(criteria.startDate);
    const approvedAtLte = toInclusiveEnd(criteria.endDate);

    const where = {
      storeId,
      status: 'approved' as const,
      approvedAt: {
        gte: approvedAtGte,
        lte: approvedAtLte,
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

    const items: ReportApprovedBudgetRow[] = rows.map((row) => ({
      id: row.id,
      budgetDate: formatBudgetDate(row.date),
      patientName: row.patient.name,
      document: row.patient.cpf ?? '',
      mobile: row.patient.phone ?? '',
      email: row.patient.email ?? '',
      responsibleMobile: row.patient.guardianPhone ?? '',
      description: row.description,
      status: 'approved',
      valueCents: row.finalValueCents,
    }));

    return { items, total };
  }
}
