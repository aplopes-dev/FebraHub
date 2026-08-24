import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';

export type SyncPendingGoogleCalendarInput = {
  storeId: string;
  agentId: string;
};

export type SyncPendingGoogleCalendarOutput = {
  synced: number;
};

@Injectable()
export class SyncPendingGoogleCalendarUseCase implements IUseCase<
  SyncPendingGoogleCalendarInput,
  SyncPendingGoogleCalendarOutput
> {
  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  async execute(
    input: SyncPendingGoogleCalendarInput,
  ): Promise<SyncPendingGoogleCalendarOutput> {
    const synced = await this.googleCalendar.syncExistingAppointmentsForAgent(
      input.storeId,
      input.agentId,
    );
    return { synced };
  }
}
