import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AgentProfileRepository } from '../../../../settings/domain/repositories/agent-profile.repository.interface';
import type { AgentProfileEntity } from '../../../../settings/domain/entities/agent-profile.entity';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';

export type GetGoogleCalendarStatusInput = {
  storeId: string;
  agentId: string;
};

export type GetGoogleCalendarStatusOutput = {
  connected: boolean;
  enabled: boolean;
  calendarId: string;
  configured: boolean;
};

@Injectable()
export class GetGoogleCalendarStatusUseCase implements IUseCase<
  GetGoogleCalendarStatusInput,
  GetGoogleCalendarStatusOutput
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async execute(
    input: GetGoogleCalendarStatusInput,
  ): Promise<GetGoogleCalendarStatusOutput> {
    const profile = await this.profiles.findByAgentId(
      input.storeId,
      input.agentId,
    );
    return mapStatus(profile, this.googleCalendar.isConfigured());
  }
}

function mapStatus(
  profile: AgentProfileEntity | null,
  configured: boolean,
): GetGoogleCalendarStatusOutput {
  return {
    connected: profile?.googleCalendarConnected ?? false,
    enabled: profile?.googleCalendarEnabled ?? false,
    calendarId: profile?.googleCalendarId ?? 'primary',
    configured,
  };
}
