import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';

@Injectable()
export class DeleteAppointmentUseCase implements IUseCase<
  { storeId: string; id: string },
  void
> {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<void> {
    const existing = await this.appointments.findById(storeId, id);
    if (!existing) throw new AppointmentNotFoundError(id);

    await this.googleCalendar.deleteEventForAgent({
      storeId,
      agentId: existing.agentId,
      googleEventId: existing.googleEventId,
    });

    const ok = await this.appointments.delete(storeId, id);
    if (!ok) throw new AppointmentNotFoundError(id);
  }
}
