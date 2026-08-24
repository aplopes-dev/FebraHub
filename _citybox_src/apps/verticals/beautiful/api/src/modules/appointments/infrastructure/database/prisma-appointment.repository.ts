import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  AppointmentRepository,
  BLOCKING_APPOINTMENT_STATUSES,
  ListAppointmentsFilter,
} from '../../domain/repositories/appointment.repository.interface';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { AppointmentServiceLine } from '../../domain/appointment.types';
import {
  Appointment as PrismaAppointment,
  AppointmentService as PrismaAppointmentService,
  Client as PrismaClientRow,
  Service as PrismaServiceRow,
  Prisma,
} from '../../../../../generated/prisma/client';
import {
  endOfDay,
  startOfDay,
  addMinutes,
} from '../../application/utils/appointment-datetime';
import {
  buildOccupancyWindows,
  windowsOverlap,
} from '../../application/utils/appointment-availability';

type AppointmentRow = PrismaAppointment & {
  client: PrismaClientRow;
  category?: { id: string; name: string; color: string } | null;
  appointmentServices: Array<
    PrismaAppointmentService & {
      service: PrismaServiceRow;
    }
  >;
};

const appointmentInclude = {
  client: true,
  category: true,
  appointmentServices: {
    include: {
      service: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.AppointmentInclude;

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async toDomain(raw: AppointmentRow): Promise<AppointmentEntity> {
    const memberIds = [
      ...new Set(raw.appointmentServices.map((line) => line.professionalId)),
    ];
    const members =
      memberIds.length === 0
        ? []
        : await this.prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, firstName: true, lastName: true },
          });
    const nameById = new Map(
      members.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim()]),
    );

    const services: AppointmentServiceLine[] = raw.appointmentServices.map(
      (line) => ({
        id: line.id,
        professionalId: line.professionalId,
        professionalName: nameById.get(line.professionalId) ?? 'Profissional',
        serviceId: line.serviceId,
        serviceName: line.service.name,
        price: line.price,
        duration: line.duration,
      }),
    );

    return AppointmentEntity.create(
      {
        storeId: raw.storeId,
        clientId: raw.clientId,
        clientName: raw.client.name,
        clientPhone: raw.client.phone,
        categoryId: raw.categoryId,
        categoryName: raw.category?.name ?? null,
        categoryColor: raw.category?.color ?? null,
        clientNotes: raw.clientNotes,
        startAt: raw.startAt,
        endAt: raw.endAt,
        status: raw.status,
        totalPrice: raw.totalPrice,
        services,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(appointment: AppointmentEntity): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: { id: appointment.id, storeId: appointment.storeId },
        select: { id: true },
      });

      if (!existing) {
        await tx.appointment.create({
          data: {
            id: appointment.id,
            storeId: appointment.storeId,
            clientId: appointment.clientId,
            categoryId: appointment.categoryId,
            clientNotes: appointment.clientNotes,
            startAt: appointment.startAt,
            endAt: appointment.endAt,
            status: appointment.status,
            totalPrice: appointment.totalPrice,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            appointmentServices: {
              create: appointment.services.map((line) => ({
                id: line.id,
                professionalId: line.professionalId,
                serviceId: line.serviceId,
                price: line.price,
                duration: line.duration,
              })),
            },
          },
        });
        return;
      }

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          categoryId: appointment.categoryId,
          clientNotes: appointment.clientNotes,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          status: appointment.status,
          totalPrice: appointment.totalPrice,
          updatedAt: appointment.updatedAt,
        },
      });

      await tx.appointmentService.deleteMany({
        where: { appointmentId: appointment.id },
      });

      await tx.appointmentService.createMany({
        data: appointment.services.map((line) => ({
          ...(line.id ? { id: line.id } : {}),
          appointmentId: appointment.id,
          professionalId: line.professionalId,
          serviceId: line.serviceId,
          price: line.price,
          duration: line.duration,
        })),
      });
    });
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentEntity | null> {
    const raw = await this.prisma.appointment.findFirst({
      where: { id, storeId },
      include: appointmentInclude,
    });
    if (!raw) return null;
    return this.toDomain(raw);
  }

  async findAll(
    storeId: string,
    filter: ListAppointmentsFilter,
  ): Promise<AppointmentEntity[]> {
    const rangeStart = startOfDay(filter.from);
    const rangeEnd = endOfDay(filter.to);

    const where: Prisma.AppointmentWhereInput = {
      storeId,
      startAt: { lte: rangeEnd },
      endAt: { gte: rangeStart },
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.professionalId) {
      where.appointmentServices = {
        some: { professionalId: filter.professionalId },
      };
    }

    const list = await this.prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { startAt: 'asc' },
    });

    return Promise.all(list.map((row) => this.toDomain(row)));
  }

  async hasOverlap(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const candidates = await this.prisma.appointment.findMany({
      where: {
        storeId,
        status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        appointmentServices: { some: { professionalId } },
      },
      include: {
        appointmentServices: true,
      },
    });

    const windows = candidates.flatMap((appointment) =>
      buildOccupancyWindows(
        appointment.startAt,
        appointment.appointmentServices.map((line) => ({
          professionalId: line.professionalId,
          duration: line.duration,
        })),
        addMinutes,
      ).filter((window) => window.professionalId === professionalId),
    );

    return windows.some((window) =>
      windowsOverlap(window.startAt, window.endAt, startAt, endAt),
    );
  }
}
