import { Injectable } from '@nestjs/common';
import {
  FitInShift,
  FitInStatus,
  InternalEventAvailability,
  InternalEventPrivacy,
  Prisma,
  RecurrenceEnd,
  RecurrenceType,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  InternalEvent,
  type InternalEventProps,
} from '../../domain/entities/internal-event.entity';
import {
  InternalEventRepository,
  type InternalEventListCriteria,
} from '../../domain/repositories/internal-event.repository.interface';

@Injectable()
export class PrismaInternalEventRepository extends InternalEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<InternalEvent | null> {
    const row = await this.prisma.internalEvent.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: InternalEventListCriteria,
  ): Promise<InternalEvent[]> {
    const rows = await this.prisma.internalEvent.findMany({
      where: this.buildWhere(storeId, criteria),
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findForCalendar(
    storeId: string,
    criteria: {
      startDate: string;
      endDate: string;
      professionalIds?: string[];
    },
  ): Promise<InternalEvent[]> {
    const rangeStart = new Date(`${criteria.startDate}T00:00:00.000Z`);
    const rangeEnd = new Date(`${criteria.endDate}T23:59:59.999Z`);

    const rows = await this.prisma.internalEvent.findMany({
      where: {
        storeId,
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
        ...(criteria.professionalIds?.length
          ? { professionalId: { in: criteria.professionalIds } }
          : {}),
      },
      orderBy: { startAt: 'asc' },
    });

    return rows.map((row) => this.toEntity(row));
  }

  async save(event: InternalEvent): Promise<InternalEvent> {
    const row = await this.prisma.internalEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        storeId: event.storeId,
        professionalId: event.professionalId,
        roomId: event.roomId,
        title: event.title,
        description: event.description,
        allDay: event.allDay,
        startAt: event.startAt,
        endAt: event.endAt,
        recurring: event.recurring,
        recurrenceType: event.recurrenceType,
        recurrenceEnd: event.recurrenceEnd,
        recurrenceEndDate: event.recurrenceEndDate,
        availability: event.availability,
        privacy: event.privacy,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
      update: {
        professionalId: event.professionalId,
        roomId: event.roomId,
        title: event.title,
        description: event.description,
        allDay: event.allDay,
        startAt: event.startAt,
        endAt: event.endAt,
        recurring: event.recurring,
        recurrenceType: event.recurrenceType,
        recurrenceEnd: event.recurrenceEnd,
        recurrenceEndDate: event.recurrenceEndDate,
        availability: event.availability,
        privacy: event.privacy,
        updatedAt: event.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.internalEvent.deleteMany({ where: { id, storeId } });
  }

  private buildWhere(
    storeId: string,
    criteria: InternalEventListCriteria,
  ): Prisma.InternalEventWhereInput {
    const rangeStart = criteria.startDate
      ? new Date(`${criteria.startDate}T00:00:00.000Z`)
      : undefined;
    const rangeEnd = criteria.endDate
      ? new Date(`${criteria.endDate}T23:59:59.999Z`)
      : undefined;

    return {
      storeId,
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
    };
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    professionalId: string;
    roomId: string | null;
    title: string;
    description: string | null;
    allDay: boolean;
    startAt: Date;
    endAt: Date;
    recurring: boolean;
    recurrenceType: RecurrenceType | null;
    recurrenceEnd: RecurrenceEnd | null;
    recurrenceEndDate: Date | null;
    availability: InternalEventAvailability;
    privacy: InternalEventPrivacy;
    createdAt: Date;
    updatedAt: Date;
  }): InternalEvent {
    const props: InternalEventProps = {
      storeId: row.storeId,
      professionalId: row.professionalId,
      roomId: row.roomId,
      title: row.title,
      description: row.description,
      allDay: row.allDay,
      startAt: row.startAt,
      endAt: row.endAt,
      recurring: row.recurring,
      recurrenceType: row.recurrenceType,
      recurrenceEnd: row.recurrenceEnd,
      recurrenceEndDate: row.recurrenceEndDate,
      availability: row.availability,
      privacy: row.privacy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return InternalEvent.with(props, row.id);
  }
}
