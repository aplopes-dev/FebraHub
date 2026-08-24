import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportSalesByPlanRepository } from '../../domain/repositories/report-sales-by-plan.repository';
import {
  REPORT_SALES_UNINFORMED_PLAN,
  type ListReportSalesByPlanCriteria,
  type ListReportSalesByPlanResult,
  type ReportSalesByPlanRow,
} from '../../domain/report-sales-by-plan.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportSalesByPlanRepository extends ReportSalesByPlanRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesByPlanCriteria,
  ): Promise<ListReportSalesByPlanResult> {
    const approvedAtGte = parseCivilDate(criteria.startDate);
    const approvedAtLte = toInclusiveEnd(criteria.endDate);
    const dateGte = parseCivilDate(criteria.startDate);
    const dateLte = parseCivilDate(criteria.endDate);

    const where = {
      storeId,
      budget: {
        status: 'approved' as const,
        OR: [
          {
            approvedAt: {
              gte: approvedAtGte,
              lte: approvedAtLte,
            },
          },
          {
            AND: [
              { approvedAt: null },
              {
                date: {
                  gte: dateGte,
                  lte: dateLte,
                },
              },
            ],
          },
        ],
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.budgetItem.findMany({
        where,
        orderBy: [
          { budget: { approvedAt: 'desc' } },
          { budget: { date: 'desc' } },
          { planName: 'asc' },
          { id: 'desc' },
        ],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          planName: true,
          treatmentName: true,
          valueCents: true,
          budget: {
            select: {
              date: true,
              approvedAt: true,
              patient: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.budgetItem.count({ where }),
    ]);

    const items: ReportSalesByPlanRow[] = rows.map((row) => {
      const saleSource = row.budget.approvedAt ?? row.budget.date;
      const planName = row.planName?.trim();

      return {
        id: row.id,
        planName: planName || REPORT_SALES_UNINFORMED_PLAN,
        saleDate: formatCivilDate(saleSource),
        patientName: row.budget.patient.name,
        treatmentName: row.treatmentName,
        valueCents: row.valueCents,
      };
    });

    return { items, total };
  }
}
