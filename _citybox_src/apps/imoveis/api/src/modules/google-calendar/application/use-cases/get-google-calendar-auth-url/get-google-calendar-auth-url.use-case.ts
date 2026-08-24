import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { GoogleCalendarNotConfiguredError } from '../../../domain/errors/google-calendar-not-configured.error';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';

export type GetGoogleCalendarAuthUrlInput = {
  storeId: string;
  agentId: string;
};

export type GetGoogleCalendarAuthUrlOutput = {
  url: string;
  configured: boolean;
};

@Injectable()
export class GetGoogleCalendarAuthUrlUseCase implements IUseCase<
  GetGoogleCalendarAuthUrlInput,
  GetGoogleCalendarAuthUrlOutput
> {
  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  async execute(
    input: GetGoogleCalendarAuthUrlInput,
  ): Promise<GetGoogleCalendarAuthUrlOutput> {
    if (!this.googleCalendar.isConfigured()) {
      throw new GoogleCalendarNotConfiguredError(
        GetGoogleCalendarAuthUrlUseCase.name,
      );
    }
    const url = this.googleCalendar.buildAuthUrl(input.storeId, input.agentId);
    return { url, configured: true };
  }
}
