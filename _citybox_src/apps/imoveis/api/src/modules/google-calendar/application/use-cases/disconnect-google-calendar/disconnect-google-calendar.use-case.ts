import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';

export type DisconnectGoogleCalendarInput = {
  storeId: string;
  agentId: string;
};

@Injectable()
export class DisconnectGoogleCalendarUseCase implements IUseCase<
  DisconnectGoogleCalendarInput,
  void
> {
  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  async execute(input: DisconnectGoogleCalendarInput): Promise<void> {
    await this.googleCalendar.disconnect(input.storeId, input.agentId);
  }
}
