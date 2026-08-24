import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportSalesBySpecialtyRepository } from '../../domain/repositories/report-sales-by-specialty.repository';
import {
  REPORT_SALES_UNINFORMED_SPECIALTY,
  type ListReportSalesBySpecialtyCriteria,
  type ListReportSalesBySpecialtyResult,
  type ReportSalesBySpecialtyRow,
} from '../../domain/report-sales-by-specialty.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportSalesBySpecialtyRepository extends ReportSalesBySpecialtyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesBySpecialtyCriteria,
  ): Promise<ListReportSalesBySpecialtyResult> {
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
          { treatment: { specialty: { name: 'asc' } } },
          { id: 'desc' },
        ],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          treatmentName: true,
          valueCents: true,
          budget: {
            select: {
              date: true,
              approvedAt: true,
              patient: { select: { name: true } },
            },
          },
          treatment: {
            select: {
              specialty: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.budgetItem.count({ where }),
    ]);

    const items: ReportSalesBySpecialtyRow[] = rows.map((row) => {
      const saleSource = row.budget.approvedAt ?? row.budget.date;
      const specialtyName = row.treatment.specialty.name?.trim();

      return {
        id: row.id,
        specialtyName: specialtyName || REPORT_SALES_UNINFORMED_SPECIALTY,
        saleDate: formatCivilDate(saleSource),
        patientName: row.budget.patient.name,
        treatmentName: row.treatmentName,
        valueCents: row.valueCents,
      };
    });

    return { items, total };
  }
}
