import { Injectable } from '@nestjs/common';
import {
  AppointmentChannel,
  AppointmentStatus,
  InsuranceType,
  Prisma,
  ReturnOption,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { BLOCKING_APPOINTMENT_STATUSES } from '../../../shared/domain/appointment-types';
import {
  Appointment,
  type AppointmentProps,
} from '../../domain/entities/appointment.entity';
import { AppointmentSlotTakenError } from '../../domain/errors/appointment.errors';
import {
  AppointmentRepository,
  type AppointmentCalendarCriteria,
  type AppointmentDashboardListItem,
  type AppointmentDetail,
  type AppointmentListCriteria,
  type CancelledAppointmentTasksListResult,
  type SaveAppointmentOptions,
} from '../../domain/repositories/appointment.repository.interface';
import { isAppointmentSlotTakenError } from './appointment-prisma.utils';

const DASHBOARD_OUTCOME_STATUSES: AppointmentStatus[] = [
  'finished',
  'missed',
  'cancelled_patient',
  'cancelled_pro',
];

const CANCELLED_TASK_STATUSES: AppointmentStatus[] = [
  'missed',
  'cancelled_patient',
  'cancelled_pro',
];

@Injectable()
export class PrismaAppointmentRepository extends AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentDetail | null> {
    const row = await this.prisma.appointment.findFirst({
      where: { id, storeId },
      include: this.includeRelations(),
    });
    return row ? this.toDetail(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: AppointmentListCriteria,
  ): Promise<AppointmentDetail[]> {
    const rows = await this.prisma.appointment.findMany({
      where: this.buildWhere(storeId, criteria),
      orderBy: this.buildOrderBy(criteria),
      skip: criteria.skip,
      take: criteria.take,
      include: this.includeRelations(),
    });
    return rows.map((row) => this.toDetail(row));
  }

  async count(
    storeId: string,
    criteria: Omit<AppointmentListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.appointment.count({
      where: this.buildWhere(storeId, criteria),
    });
  }

  async findForCalendar(
    storeId: string,
    criteria: AppointmentCalendarCriteria,
  ): Promise<AppointmentDetail[]> {
    const rangeStart = this.parseDateStart(criteria.startDate);
    const rangeEnd = this.parseDateEnd(criteria.endDate);

    const rows = await this.prisma.appointment.findMany({
      where: {
        storeId,
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
        ...(criteria.professionalIds?.length
          ? { professionalId: { in: criteria.professionalIds } }
          : {}),
      },
      orderBy: { startAt: 'asc' },
      include: this.includeRelations(),
    });

    return rows.map((row) => this.toDetail(row));
  }

  async findBlockingByProfessionalAndRange(
    storeId: string,
    professionalId: string,
    rangeStart: Date,
    rangeEnd: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]> {
    const rows = await this.prisma.appointment.findMany({
      where: this.overlapWhere(
        storeId,
        professionalId,
        rangeStart,
        rangeEnd,
        excludeAppointmentId,
      ),
    });
    return rows.map((row) => this.toEntity(row));
  }

  async hasOverlap(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: this.overlapWhere(
        storeId,
        professionalId,
        startAt,
        endAt,
        excludeAppointmentId,
      ),
    });
    return count > 0;
  }

  async save(
    appointment: Appointment,
    options?: SaveAppointmentOptions,
  ): Promise<AppointmentDetail> {
    const fitInId = options?.fitInId ?? appointment.fitInId;

    try {
      if (fitInId) {
        await this.prisma.$transaction(async (tx) => {
          await tx.appointment.upsert({
            where: { id: appointment.id },
            create: this.toCreateData(appointment, fitInId),
            update: this.toUpdateData(appointment, fitInId),
          });
          await tx.fitIn.updateMany({
            where: { id: fitInId, storeId: appointment.storeId },
            data: { status: 'scheduled' },
          });
        });
      } else {
        await this.prisma.appointment.upsert({
          where: { id: appointment.id },
          create: this.toCreateData(appointment, appointment.fitInId),
          update: this.toUpdateData(appointment, appointment.fitInId),
        });
      }
    } catch (error) {
      if (isAppointmentSlotTakenError(error)) {
        throw new AppointmentSlotTakenError(PrismaAppointmentRepository.name);
      }
      throw error;
    }

    const saved = await this.findById(appointment.storeId, appointment.id);
    if (!saved) {
      throw new Error('Appointment not found after save');
    }
    return saved;
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.appointment.deleteMany({ where: { id, storeId } });
  }

  async listAppointmentsForDashboardInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<AppointmentDashboardListItem[]> {
    const rows = await this.prisma.appointment.findMany({
      where: {
        storeId,
        status: { in: DASHBOARD_OUTCOME_STATUSES },
        startAt: {
          gte: range.startAt,
          lte: range.endAt,
        },
      },
      select: {
        id: true,
        startAt: true,
        status: true,
        categoryId: true,
        patientId: true,
        professionalId: true,
        patient: { select: { name: true, phone: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ startAt: 'desc' }, { id: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      startAt: row.startAt,
      status: row.status as AppointmentDashboardListItem['status'],
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
      patientId: row.patientId,
      patientName: row.patient.name,
      phone: row.patient.phone ?? '',
      professionalId: row.professionalId,
    }));
  }

  async listAppointmentDashboardYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM start_at AT TIME ZONE 'UTC')::int AS year
      FROM clinica.appointments
      WHERE store_id = ${storeId}
        AND status IN ('finished', 'missed', 'cancelled_patient', 'cancelled_pro')
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  async listCancelledAppointmentTasksInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
    pagination: { skip: number; take: number },
  ): Promise<CancelledAppointmentTasksListResult> {
    const where: Prisma.AppointmentWhereInput = {
      storeId,
      status: { in: CANCELLED_TASK_STATUSES },
      startAt: {
        gte: range.startAt,
        lte: range.endAt,
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        select: {
          id: true,
          patientId: true,
          professionalId: true,
          startAt: true,
          durationMin: true,
          categoryId: true,
          notes: true,
          status: true,
          patient: { select: { name: true, phone: true } },
        },
        orderBy: [{ startAt: 'desc' }, { id: 'asc' }],
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        patientId: row.patientId,
        patientName: row.patient.name,
        patientPhone: row.patient.phone ?? '',
        professionalId: row.professionalId,
        startAt: row.startAt,
        durationMin: row.durationMin,
        categoryId: row.categoryId,
        notes: row.notes,
        status: row.status as 'missed' | 'cancelled_patient' | 'cancelled_pro',
      })),
    };
  }

  async findConfirmedInStartRange(
    storeId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<AppointmentDetail[]> {
    const rows = await this.prisma.appointment.findMany({
      where: {
        storeId,
        status: 'confirmed',
        startAt: {
          gt: rangeStart,
          lte: rangeEnd,
        },
      },
      include: this.includeRelations(),
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toDetail(row));
  }

  async findScheduledInStartRange(
    storeId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<AppointmentDetail[]> {
    const rows = await this.prisma.appointment.findMany({
      where: {
        storeId,
        status: 'scheduled',
        startAt: {
          gt: rangeStart,
          lte: rangeEnd,
        },
      },
      include: this.includeRelations(),
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toDetail(row));
  }

  private overlapWhere(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Prisma.AppointmentWhereInput {
    return {
      storeId,
      professionalId,
      status: { in: BLOCKING_APPOINTMENT_STATUSES as AppointmentStatus[] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    };
  }

  private buildWhere(
    storeId: string,
    criteria: Omit<AppointmentListCriteria, 'skip' | 'take'>,
  ): Prisma.AppointmentWhereInput {
    const search = criteria.search?.trim();
    const rangeStart = criteria.startDate
      ? this.parseDateStart(criteria.startDate)
      : undefined;
    const rangeEnd = criteria.endDate
      ? this.parseDateEnd(criteria.endDate)
      : undefined;

    return {
      storeId,
      ...(criteria.patientId ? { patientId: criteria.patientId } : {}),
      ...(criteria.status ? { status: criteria.status } : {}),
      ...(criteria.professionalIds?.length
        ? { professionalId: { in: criteria.professionalIds } }
        : {}),
      ...(rangeStart || rangeEnd
        ? {
            AND: [
              ...(rangeEnd ? [{ startAt: { lt: rangeEnd } }] : []),
              ...(rangeStart ? [{ endAt: { gt: rangeStart } }] : []),
            ],
          }
        : {}),
      ...(search
        ? {
            patient: {
              name: { contains: search, mode: 'insensitive' as const },
            },
          }
        : {}),
    };
  }

  private buildOrderBy(
    criteria: AppointmentListCriteria,
  ): Prisma.AppointmentOrderByWithRelationInput {
    const sortOrder = criteria.sortOrder ?? 'asc';
    if (criteria.sortBy === 'status') return { status: sortOrder };
    if (criteria.sortBy === 'patientName') {
      return { patient: { name: sortOrder } };
    }
    return { startAt: sortOrder };
  }

  private includeRelations() {
    return {
      patient: { select: { name: true, phone: true } },
      category: { select: { id: true, name: true, color: true } },
    };
  }

  private parseDateStart(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private parseDateEnd(date: string): Date {
    return new Date(`${date}T23:59:59.999Z`);
  }

  private toCreateData(appointment: Appointment, fitInId: string | null) {
    return {
      id: appointment.id,
      storeId: appointment.storeId,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      procedureId: appointment.procedureId,
      roomId: appointment.roomId,
      categoryId: appointment.categoryId,
      status: appointment.status,
      channel: appointment.channel,
      confirmationSource: appointment.confirmationSource,
      insuranceType: appointment.insuranceType,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      durationMin: appointment.durationMin,
      notes: appointment.notes,
      returnOption: appointment.returnOption,
      returnDate: appointment.returnDate,
      returnReason: appointment.returnReason,
      fitInId,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private toUpdateData(appointment: Appointment, fitInId: string | null) {
    return {
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      procedureId: appointment.procedureId,
      roomId: appointment.roomId,
      categoryId: appointment.categoryId,
      status: appointment.status,
      channel: appointment.channel,
      confirmationSource: appointment.confirmationSource,
      insuranceType: appointment.insuranceType,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      durationMin: appointment.durationMin,
      notes: appointment.notes,
      returnOption: appointment.returnOption,
      returnDate: appointment.returnDate,
      returnReason: appointment.returnReason,
      fitInId,
      updatedAt: appointment.updatedAt,
    };
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    patientId: string;
    professionalId: string;
    procedureId: string | null;
    roomId: string | null;
    categoryId: string | null;
    status: AppointmentStatus;
    channel: AppointmentChannel | null;
    confirmationSource: 'manual' | 'whatsapp' | null;
    insuranceType: InsuranceType;
    startAt: Date;
    endAt: Date;
    durationMin: number;
    notes: string | null;
    returnOption: ReturnOption | null;
    returnDate: Date | null;
    returnReason: string | null;
    fitInId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Appointment {
    const props: AppointmentProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      professionalId: row.professionalId,
      procedureId: row.procedureId,
      roomId: row.roomId,
      categoryId: row.categoryId,
      status: row.status,
      channel: row.channel,
      confirmationSource: row.confirmationSource,
      insuranceType: row.insuranceType,
      startAt: row.startAt,
      endAt: row.endAt,
      durationMin: row.durationMin,
      notes: row.notes,
      returnOption: row.returnOption,
      returnDate: row.returnDate,
      returnReason: row.returnReason,
      fitInId: row.fitInId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Appointment.with(props, row.id);
  }

  private toDetail(row: {
    id: string;
    storeId: string;
    patientId: string;
    professionalId: string;
    procedureId: string | null;
    roomId: string | null;
    categoryId: string | null;
    status: AppointmentStatus;
    channel: AppointmentChannel | null;
    confirmationSource: 'manual' | 'whatsapp' | null;
    insuranceType: InsuranceType;
    startAt: Date;
    endAt: Date;
    durationMin: number;
    notes: string | null;
    returnOption: ReturnOption | null;
    returnDate: Date | null;
    returnReason: string | null;
    fitInId: string | null;
    createdAt: Date;
    updatedAt: Date;
    patient: { name: string; phone: string | null };
    category: { id: string; name: string; color: string } | null;
  }): AppointmentDetail {
    return {
      appointment: this.toEntity(row),
      patientName: row.patient.name,
      patientPhone: row.patient.phone,
      category: row.category
        ? {
            id: row.category.id,
            name: row.category.name,
            color: row.category.color,
          }
        : null,
    };
  }
}
