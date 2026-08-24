import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportSalesByTreatmentRepository } from '../../domain/repositories/report-sales-by-treatment.repository';
import {
  REPORT_SALES_UNINFORMED_PLAN,
  REPORT_SALES_UNINFORMED_TREATMENT,
  type ListReportSalesByTreatmentCriteria,
  type ListReportSalesByTreatmentResult,
  type ReportSalesByTreatmentRow,
} from '../../domain/report-sales-by-treatment.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportSalesByTreatmentRepository extends ReportSalesByTreatmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesByTreatmentCriteria,
  ): Promise<ListReportSalesByTreatmentResult> {
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
          { treatmentName: 'asc' },
          { id: 'desc' },
        ],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          treatmentName: true,
          planName: true,
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

    const items: ReportSalesByTreatmentRow[] = rows.map((row) => {
      const saleSource = row.budget.approvedAt ?? row.budget.date;
      const treatmentName = row.treatmentName?.trim();
      const planName = row.planName?.trim();

      return {
        id: row.id,
        treatmentName: treatmentName || REPORT_SALES_UNINFORMED_TREATMENT,
        saleDate: formatCivilDate(saleSource),
        patientName: row.budget.patient.name,
        planName: planName || REPORT_SALES_UNINFORMED_PLAN,
        valueCents: row.valueCents,
      };
    });

    return { items, total };
  }
}
