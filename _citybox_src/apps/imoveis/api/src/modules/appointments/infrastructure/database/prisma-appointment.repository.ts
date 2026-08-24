import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  type AppointmentWritePayload,
  type ListAppointmentsFilters,
  type ListAppointmentsResult,
} from '../../domain/repositories/appointment.repository.interface';
import {
  appointmentKindToApi,
  appointmentKindToPrisma,
} from '../../domain/mappers/appointment-enum.mapper';

type AppointmentRow = Prisma.AppointmentGetPayload<object>;

@Injectable()
export class PrismaAppointmentRepository extends AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    filters: ListAppointmentsFilters,
  ): Promise<ListAppointmentsResult> {
    const where = this.buildWhere(storeId, filters);
    const skip = (filters.page - 1) * filters.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        skip,
        take: filters.perPage,
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items: rows.map((r) => this.toEntity(r)), total };
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentEntity | null> {
    const row = await this.prisma.appointment.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findOpenFollowUpByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<AppointmentEntity | null> {
    const row = await this.prisma.appointment.findFirst({
      where: {
        storeId,
        leadId,
        kind: 'follow_up',
        done: false,
      },
      orderBy: { startsAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(payload: AppointmentWritePayload): Promise<AppointmentEntity> {
    const id = randomUUID();
    const row = await this.prisma.appointment.create({
      data: {
        id,
        storeId: payload.storeId,
        title: payload.title.trim(),
        description: (payload.description ?? '').trim(),
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        location: (payload.location ?? '').trim(),
        kind: appointmentKindToPrisma(payload.kind),
        agentId: payload.agentId.trim(),
        done: payload.done ?? false,
        leadId: payload.leadId ?? null,
        leadName: payload.leadName ?? null,
        leadEmail: payload.leadEmail ?? null,
        leadPhone: payload.leadPhone ?? null,
        leadPhotoUrl: payload.leadPhotoUrl ?? null,
        propertyId: payload.propertyId ?? null,
        googleEventId: payload.googleEventId ?? null,
      },
    });
    return this.toEntity(row);
  }

  async update(
    storeId: string,
    id: string,
    payload: Omit<AppointmentWritePayload, 'storeId'>,
  ): Promise<AppointmentEntity | null> {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, storeId },
    });
    if (!existing) return null;

    const row = await this.prisma.appointment.update({
      where: { id },
      data: {
        title: payload.title.trim(),
        description: (payload.description ?? '').trim(),
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        location: (payload.location ?? '').trim(),
        kind: appointmentKindToPrisma(payload.kind),
        agentId: payload.agentId.trim(),
        done: payload.done ?? false,
        leadId: payload.leadId ?? null,
        leadName: payload.leadName ?? null,
        leadEmail: payload.leadEmail ?? null,
        leadPhone: payload.leadPhone ?? null,
        leadPhotoUrl: payload.leadPhotoUrl ?? null,
        propertyId: payload.propertyId ?? null,
        ...(payload.googleEventId !== undefined
          ? { googleEventId: payload.googleEventId }
          : {}),
      },
    });
    return this.toEntity(row);
  }

  async setGoogleEventId(
    storeId: string,
    id: string,
    googleEventId: string | null,
  ): Promise<AppointmentEntity | null> {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!existing) return null;
    const row = await this.prisma.appointment.update({
      where: { id },
      data: { googleEventId },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const result = await this.prisma.appointment.deleteMany({
      where: { id, storeId },
    });
    return result.count > 0;
  }

  private buildWhere(
    storeId: string,
    filters: ListAppointmentsFilters,
  ): Prisma.AppointmentWhereInput {
    const and: Prisma.AppointmentWhereInput[] = [
      { storeId },
      { startsAt: { lt: filters.toExclusive } },
      { endsAt: { gt: filters.from } },
    ];

    if (filters.agentId) {
      and.push({ agentId: filters.agentId });
    }
    if (filters.excludeAgentId) {
      and.push({ agentId: { not: filters.excludeAgentId } });
    }
    if (filters.kind?.length) {
      and.push({
        kind: { in: filters.kind.map(appointmentKindToPrisma) },
      });
    }
    if (filters.done !== undefined) {
      and.push({ done: filters.done });
    }

    return { AND: and };
  }

  private toEntity(row: AppointmentRow): AppointmentEntity {
    return AppointmentEntity.create(
      {
        storeId: row.storeId,
        title: row.title,
        description: row.description,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        location: row.location,
        kind: appointmentKindToApi(row.kind),
        agentId: row.agentId,
        done: row.done,
        leadId: row.leadId,
        leadName: row.leadName,
        leadEmail: row.leadEmail,
        leadPhone: row.leadPhone,
        leadPhotoUrl: row.leadPhotoUrl,
        propertyId: row.propertyId,
        googleEventId: row.googleEventId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
