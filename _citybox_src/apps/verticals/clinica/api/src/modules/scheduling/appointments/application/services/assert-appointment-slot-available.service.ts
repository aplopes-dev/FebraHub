import { Injectable } from '@nestjs/common';
import { ClinicStoreProfile } from '../../../../clinic-profile/domain/entities/clinic-store-profile.entity';
import { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { InternalEventRepository } from '../../../internal-events/domain/repositories/internal-event.repository.interface';
import { isAppointmentWithinClinicHours } from '../../../shared/domain/clinic-hours.utils';
import { busyExpandedEventBlocksRange } from '../../../shared/domain/internal-event-blocking.utils';
import { expandInternalEvents } from '../../../shared/domain/recurrence-expander';
import {
  AppointmentOutsideClinicHoursError,
  AppointmentSlotTakenError,
} from '../../domain/errors/appointment.errors';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.interface';

@Injectable()
export class AssertAppointmentSlotAvailableService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly internalEventRepository: InternalEventRepository,
    private readonly clinicProfileRepository: ClinicStoreProfileRepository,
  ) {}

  async execute(
    context: string,
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<void> {
    const profile =
      (await this.clinicProfileRepository.findByStoreId(storeId)) ??
      ClinicStoreProfile.defaults(storeId);

    if (
      !isAppointmentWithinClinicHours(
        startAt,
        endAt,
        profile.openingTime,
        profile.closingTime,
      )
    ) {
      throw new AppointmentOutsideClinicHoursError(context);
    }

    const overlap = await this.appointmentRepository.hasOverlap(
      storeId,
      professionalId,
      startAt,
      endAt,
      excludeAppointmentId,
    );
    if (overlap) {
      throw new AppointmentSlotTakenError(context);
    }

    const date = startAt.toISOString().slice(0, 10);
    const rangeStart = new Date(`${date}T00:00:00.000Z`);
    const rangeEnd = new Date(`${date}T23:59:59.999Z`);

    const events = await this.internalEventRepository.findForCalendar(storeId, {
      startDate: date,
      endDate: date,
      professionalIds: [professionalId],
    });

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

    const blockedByCommitment = expanded.some((event) =>
      busyExpandedEventBlocksRange(event, startAt, endAt),
    );

    if (blockedByCommitment) {
      throw new AppointmentSlotTakenError(context);
    }
  }
}
