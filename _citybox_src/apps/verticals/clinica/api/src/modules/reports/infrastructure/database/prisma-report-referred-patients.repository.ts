import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportReferredPatientsRepository } from '../../domain/repositories/report-referred-patients.repository';
import {
  REPORT_REFERRED_BY_UNINFORMED,
  type ListReportReferredPatientsCriteria,
  type ListReportReferredPatientsResult,
  type ReportReferredPatientRow,
} from '../../domain/report-referred-patients.types';
import { parseCivilDate } from '../../domain/utils/birthday-civil-range';

const REFERRED_ORIGIN_SYSTEM_KEYS = [
  'indicacao',
  'indicacao_profissional',
  'indicacao_profissional_externo',
] as const;

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaReportReferredPatientsRepository extends ReportReferredPatientsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportReferredPatientsCriteria,
  ): Promise<ListReportReferredPatientsResult> {
    const createdAtGte = parseCivilDate(criteria.startDate);
    const createdAtLte = toInclusiveEnd(criteria.endDate);

    const where: Prisma.PatientWhereInput = {
      storeId,
      createdAt: {
        gte: createdAtGte,
        lte: createdAtLte,
      },
      referralOrigin: {
        systemKey: {
          in: [...REFERRED_ORIGIN_SYSTEM_KEYS],
        },
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          name: true,
          createdAt: true,
          referredByMemberName: true,
          referredByPatient: { select: { name: true } },
          referredByExternalProfessional: { select: { name: true } },
          _count: {
            select: {
              budgets: { where: { status: 'approved' } },
            },
          },
          appointments: {
            where: {
              status: {
                notIn: ['cancelled_patient', 'cancelled_pro'],
              },
            },
            orderBy: { startAt: 'asc' },
            take: 1,
            select: { startAt: true },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    const items: ReportReferredPatientRow[] = rows.map((row) => {
      const firstAppointment = row.appointments[0]?.startAt ?? null;
      const referredBy =
        row.referredByPatient?.name?.trim() ||
        row.referredByMemberName?.trim() ||
        row.referredByExternalProfessional?.name?.trim() ||
        REPORT_REFERRED_BY_UNINFORMED;

      return {
        id: row.id,
        referredPatientName: row.name,
        referredBy,
        referralDate: formatCivilDate(row.createdAt),
        firstAppointmentDate: firstAppointment
          ? formatCivilDate(firstAppointment)
          : null,
        approvedBudgetsCount: row._count.budgets,
      };
    });

    return { items, total };
  }
}
