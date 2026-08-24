import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { ClinicStoreProfileRepository } from '../../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';

import { ClinicStoreProfile } from '../../../../../clinic-profile/domain/entities/clinic-store-profile.entity';

import { ProfessionalServiceHoursRepository } from '../../../../../team-service-hours/domain/professional-service-hours.repository';

import { DEFAULT_SERVICE_HOURS } from '../../../../../team-service-hours/domain/service-hours.types';

import { AppointmentRepository } from '../../../../appointments/domain/repositories/appointment.repository.interface';

import { InternalEventRepository } from '../../../../internal-events/domain/repositories/internal-event.repository.interface';

import { calculateAvailableSlots } from '../../../../shared/domain/available-slots-calculator';

import { expandInternalEvents } from '../../../../shared/domain/recurrence-expander';

export type GetAvailableSlotsDto = {
  storeId: string;

  professionalId: string;

  date: string;

  durationMin: number;
};

export type GetAvailableSlotsResult = {
  date: string;

  professionalId: string;

  durationMin: number;

  workingWindow: { startTime: string; endTime: string } | null;

  slots: Array<{ startTime: string; endTime: string; available: boolean }>;
};

@Injectable()
export class GetAvailableSlotsUseCase implements IUseCase<
  GetAvailableSlotsDto,
  GetAvailableSlotsResult
> {
  constructor(
    private readonly clinicProfileRepository: ClinicStoreProfileRepository,

    private readonly serviceHoursRepository: ProfessionalServiceHoursRepository,

    private readonly appointmentRepository: AppointmentRepository,

    private readonly internalEventRepository: InternalEventRepository,
  ) {}

  async execute(dto: GetAvailableSlotsDto): Promise<GetAvailableSlotsResult> {
    const profile =
      (await this.clinicProfileRepository.findByStoreId(dto.storeId)) ??
      ClinicStoreProfile.defaults(dto.storeId);

    const serviceHours =
      (await this.serviceHoursRepository.findByMember(
        dto.storeId,

        dto.professionalId,
      )) ?? DEFAULT_SERVICE_HOURS;

    const rangeStart = new Date(`${dto.date}T00:00:00.000Z`);

    const rangeEnd = new Date(`${dto.date}T23:59:59.999Z`);

    const [blockingAppointments, events] = await Promise.all([
      this.appointmentRepository.findBlockingByProfessionalAndRange(
        dto.storeId,

        dto.professionalId,

        rangeStart,

        rangeEnd,
      ),

      this.internalEventRepository.findForCalendar(dto.storeId, {
        startDate: dto.date,

        endDate: dto.date,

        professionalIds: [dto.professionalId],
      }),
    ]);

    const busyEvents = expandInternalEvents(
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

    const result = calculateAvailableSlots({
      date: dto.date,

      durationMin: dto.durationMin,

      clinicOpeningTime: profile.openingTime,

      clinicClosingTime: profile.closingTime,

      serviceHours,

      appointments: blockingAppointments.map((appointment) => ({
        startAt: appointment.startAt,

        endAt: appointment.endAt,
      })),

      busyEvents,

      now: new Date(),
    });

    return {
      date: result.date,

      professionalId: dto.professionalId,

      durationMin: result.durationMin,

      workingWindow: result.workingWindow,

      slots: result.slots,
    };
  }
}
