import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportOpenTreatmentsRepository } from '../../domain/repositories/report-open-treatments.repository';
import type {
  ListReportOpenTreatmentsCriteria,
  ListReportOpenTreatmentsResult,
  ReportOpenTreatmentsWithoutAppointmentRow,
} from '../../domain/report-open-treatments.types';

const LIVE_APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'patient_waiting',
  'in_progress',
] as const;

@Injectable()
export class PrismaReportOpenTreatmentsRepository extends ReportOpenTreatmentsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportOpenTreatmentsCriteria,
  ): Promise<ListReportOpenTreatmentsResult> {
    const where = {
      storeId,
      status: criteria.status,
      treatments: {
        some: {
          status: 'active' as const,
        },
      },
      appointments: {
        none: {
          status: { in: [...LIVE_APPOINTMENT_STATUSES] },
          OR: [
            { startAt: { gte: criteria.now } },
            { status: 'in_progress' as const },
          ],
        },
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          name: true,
          landlinePhone: true,
          phone: true,
          cpf: true,
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    const items: ReportOpenTreatmentsWithoutAppointmentRow[] = rows.map(
      (row) => ({
        id: row.id,
        patientName: row.name,
        phone: row.landlinePhone ?? '',
        mobile: row.phone ?? '',
        document: row.cpf ?? '',
      }),
    );

    return { items, total };
  }
}
