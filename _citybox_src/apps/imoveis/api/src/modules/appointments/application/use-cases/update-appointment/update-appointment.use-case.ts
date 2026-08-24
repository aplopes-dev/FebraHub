import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import type { ApiAppointmentKind } from '../../../domain/mappers/appointment-enum.mapper';
import {
  normalizeAppointmentWrite,
  type AppointmentWriteFields,
} from '../shared/normalize-appointment-write';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';

export type UpdateAppointmentInput = AppointmentWriteFields & {
  storeId: string;
  id: string;
  kind: ApiAppointmentKind;
};

@Injectable()
export class UpdateAppointmentUseCase implements IUseCase<
  UpdateAppointmentInput,
  AppointmentEntity
> {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async execute(input: UpdateAppointmentInput): Promise<AppointmentEntity> {
    const { storeId, id, ...fields } = input;
    const existing = await this.appointments.findById(storeId, id);
    if (!existing) throw new AppointmentNotFoundError(id);

    const normalized = normalizeAppointmentWrite(
      fields,
      UpdateAppointmentUseCase.name,
    );

    const agentChanged = existing.agentId !== normalized.agentId.trim();
    if (agentChanged && existing.googleEventId) {
      await this.googleCalendar.deleteEventForAgent({
        storeId,
        agentId: existing.agentId,
        googleEventId: existing.googleEventId,
      });
    }

    const updated = await this.appointments.update(storeId, id, {
      ...normalized,
      googleEventId: agentChanged ? null : existing.googleEventId,
    });
    if (!updated) throw new AppointmentNotFoundError(id);

    const eventId = await this.googleCalendar.upsertEventForAgent({
      storeId,
      agentId: updated.agentId,
      appointment: updated,
    });

    if (eventId === updated.googleEventId) return updated;
    if (eventId === null && !updated.googleEventId) return updated;

    const linked = await this.appointments.setGoogleEventId(
      storeId,
      updated.id,
      eventId,
    );
    return linked ?? updated.with({ googleEventId: eventId });
  }
}
