import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import type { ApiAppointmentKind } from '../../../domain/mappers/appointment-enum.mapper';
import {
  normalizeAppointmentWrite,
  type AppointmentWriteFields,
} from '../shared/normalize-appointment-write';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';

export type CreateAppointmentInput = AppointmentWriteFields & {
  storeId: string;
  kind: ApiAppointmentKind;
};

@Injectable()
export class CreateAppointmentUseCase implements IUseCase<
  CreateAppointmentInput,
  AppointmentEntity
> {
  private readonly logger = new Logger(CreateAppointmentUseCase.name);

  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<AppointmentEntity> {
    const { storeId, ...fields } = input;
    const normalized = normalizeAppointmentWrite(
      fields,
      CreateAppointmentUseCase.name,
    );
    const created = await this.appointments.create({ storeId, ...normalized });

    this.logger.log(
      `[create] appointment=${created.id} storeId=${storeId} agentId=${created.agentId} → Google Calendar sync`,
    );

    let eventId: string | null = null;
    try {
      eventId = await this.googleCalendar.upsertEventForAgent({
        storeId,
        agentId: created.agentId,
        appointment: created,
      });
    } catch (error) {
      // upsert já engole erros de API; isto só pega falhas inesperadas.
      this.logger.error(
        `[create] Google Calendar sync threw appointment=${created.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    if (!eventId) {
      this.logger.warn(
        `[create] appointment=${created.id} sem googleEventId (sync skip/falha — compromisso local OK)`,
      );
      return created;
    }

    const linked = await this.appointments.setGoogleEventId(
      storeId,
      created.id,
      eventId,
    );
    this.logger.log(
      `[create] appointment=${created.id} googleEventId=${eventId}`,
    );
    return linked ?? created.with({ googleEventId: eventId });
  }
}
