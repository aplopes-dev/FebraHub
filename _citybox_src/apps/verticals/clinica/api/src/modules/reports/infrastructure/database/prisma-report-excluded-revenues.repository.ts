import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportExcludedRevenuesRepository } from '../../domain/repositories/report-excluded-revenues.repository';
import {
  REPORT_EXCLUDED_REVENUE_NO_PATIENT,
  REPORT_EXCLUDED_REVENUE_UNINFORMED_BY,
  type ListReportExcludedRevenuesCriteria,
  type ListReportExcludedRevenuesResult,
  type ReportExcludedRevenueRow,
} from '../../domain/report-excluded-revenues.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportExcludedRevenuesRepository extends ReportExcludedRevenuesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportExcludedRevenuesCriteria,
  ): Promise<ListReportExcludedRevenuesResult> {
    const updatedAtGte = parseCivilDate(criteria.startDate);
    const updatedAtLte = toInclusiveEnd(criteria.endDate);

    const where = {
      storeId,
      type: 'income' as const,
      status: 'cancelled' as const,
      updatedAt: {
        gte: updatedAtGte,
        lte: updatedAtLte,
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.financialEntry.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          description: true,
          valueCents: true,
          paidValueCents: true,
          updatedAt: true,
          cancelledByName: true,
          patient: { select: { name: true } },
        },
      }),
      this.prisma.financialEntry.count({ where }),
    ]);

    const items: ReportExcludedRevenueRow[] = rows.map((row) => ({
      id: row.id,
      patientName:
        row.patient?.name?.trim() || REPORT_EXCLUDED_REVENUE_NO_PATIENT,
      description: row.description,
      valueCents: row.paidValueCents ?? row.valueCents,
      excludedAt: formatCivilDate(row.updatedAt),
      excludedBy:
        row.cancelledByName?.trim() || REPORT_EXCLUDED_REVENUE_UNINFORMED_BY,
    }));

    return { items, total };
  }
}
