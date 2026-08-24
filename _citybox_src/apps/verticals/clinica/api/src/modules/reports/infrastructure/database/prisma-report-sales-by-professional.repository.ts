import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportSalesByProfessionalRepository } from '../../domain/repositories/report-sales-by-professional.repository';
import {
  REPORT_SALES_UNINFORMED_PROFESSIONAL,
  type ListReportSalesByProfessionalCriteria,
  type ListReportSalesByProfessionalResult,
  type ReportSalesByProfessionalRow,
} from '../../domain/report-sales-by-professional.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportSalesByProfessionalRepository extends ReportSalesByProfessionalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesByProfessionalCriteria,
  ): Promise<ListReportSalesByProfessionalResult> {
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
          { professionalName: 'asc' },
          { id: 'desc' },
        ],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          professionalName: true,
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

    const items: ReportSalesByProfessionalRow[] = rows.map((row) => {
      const saleSource = row.budget.approvedAt ?? row.budget.date;
      const professionalName = row.professionalName?.trim();

      return {
        id: row.id,
        professionalName:
          professionalName || REPORT_SALES_UNINFORMED_PROFESSIONAL,
        saleDate: formatCivilDate(saleSource),
        patientName: row.budget.patient.name,
        treatmentName: row.treatmentName,
        valueCents: row.valueCents,
      };
    });

    return { items, total };
  }
}
