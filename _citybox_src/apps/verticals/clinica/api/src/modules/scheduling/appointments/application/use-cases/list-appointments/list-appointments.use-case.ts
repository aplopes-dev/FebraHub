import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import { InternalEventRepository } from '../../../../internal-events/domain/repositories/internal-event.repository.interface';
import { expandInternalEvents } from '../../../../shared/domain/recurrence-expander';
import type {
  GetAppointmentCalendarDto,
  ListAppointmentsDto,
  ListAppointmentsResult,
} from '../../dtos/appointment.dto';
import {
  toAppointmentPresentation,
  toCalendarAppointmentItem,
} from '../../dtos/appointment.dto';

@Injectable()
export class ListAppointmentsUseCase implements IUseCase<
  ListAppointmentsDto,
  ListAppointmentsResult
> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(dto: ListAppointmentsDto): Promise<ListAppointmentsResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const criteria = {
      skip,
      take: perPage,
      search: dto.search?.trim() || undefined,
      startDate: dto.startDate,
      endDate: dto.endDate,
      professionalIds: dto.professionalIds,
      status: dto.status,
      patientId: dto.patientId,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder ?? 'asc',
    };

    const [items, total] = await Promise.all([
      this.appointmentRepository.findMany(dto.storeId, criteria),
      this.appointmentRepository.count(dto.storeId, criteria),
    ]);

    return {
      items: items.map((item) => toAppointmentPresentation(item)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}

export type CalendarResult = {
  appointments: ReturnType<typeof toCalendarAppointmentItem>[];
  schedules: Array<{
    id: string;
    professionalId: string;
    title: string;
    description: string | null;
    allDay: boolean;
    startDate: string;
    endDate: string;
    recurring: boolean;
    recurrenceType: string | null;
    recurrenceEnd: string | null;
    recurrenceEndDate: string | null;
    availability: string;
    privacy: string;
  }>;
};

@Injectable()
export class GetAppointmentCalendarUseCase implements IUseCase<
  GetAppointmentCalendarDto,
  CalendarResult
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly internalEventRepository: InternalEventRepository,
  ) {}

  async execute(dto: GetAppointmentCalendarDto): Promise<CalendarResult> {
    const [appointments, events] = await Promise.all([
      this.appointmentRepository.findForCalendar(dto.storeId, {
        startDate: dto.startDate,
        endDate: dto.endDate,
        professionalIds: dto.professionalIds,
      }),
      this.internalEventRepository.findForCalendar(dto.storeId, {
        startDate: dto.startDate,
        endDate: dto.endDate,
        professionalIds: dto.professionalIds,
      }),
    ]);

    const rangeStart = new Date(`${dto.startDate}T00:00:00.000Z`);
    const rangeEnd = new Date(`${dto.endDate}T23:59:59.999Z`);

    const expanded = expandInternalEvents(
      events.map((event) => ({
        id: event.id,
        professionalId: event.professionalId,
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
      })),
      rangeStart,
      rangeEnd,
    );

    return {
      appointments: appointments.map((item) => toCalendarAppointmentItem(item)),
      schedules: expanded.map((occurrence) => ({
        id: occurrence.id,
        professionalId: occurrence.professionalId,
        title: occurrence.title,
        description: occurrence.description,
        allDay: occurrence.allDay,
        startDate: occurrence.startDate,
        endDate: occurrence.endDate,
        recurring: occurrence.recurring,
        recurrenceType: occurrence.recurrenceType,
        recurrenceEnd: occurrence.recurrenceEnd,
        recurrenceEndDate: occurrence.recurrenceEndDate,
        availability: occurrence.availability,
        privacy: occurrence.privacy,
      })),
    };
  }
}
