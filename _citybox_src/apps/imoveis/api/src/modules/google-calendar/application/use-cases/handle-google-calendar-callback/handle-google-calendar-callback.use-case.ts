import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';

export type HandleGoogleCalendarCallbackInput = {
  code: string | undefined;
  state: string | undefined;
  error: string | undefined;
};

export type HandleGoogleCalendarCallbackOutput = {
  redirectUrl: string;
};

@Injectable()
export class HandleGoogleCalendarCallbackUseCase implements IUseCase<
  HandleGoogleCalendarCallbackInput,
  HandleGoogleCalendarCallbackOutput
> {
  private readonly logger = new Logger(
    HandleGoogleCalendarCallbackUseCase.name,
  );

  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  async execute(
    input: HandleGoogleCalendarCallbackInput,
  ): Promise<HandleGoogleCalendarCallbackOutput> {
    if (input.error) {
      this.logger.warn(`[callback] Google recusou: ${input.error}`);
      return {
        redirectUrl: this.googleCalendar.frontendRedirectUrl({
          connected: 'error',
          reason: input.error,
        }),
      };
    }
    if (!input.code?.trim() || !input.state?.trim()) {
      this.logger.warn('[callback] code ou state ausentes');
      return {
        redirectUrl: this.googleCalendar.frontendRedirectUrl({
          connected: 'error',
          reason: 'missing_code',
        }),
      };
    }

    try {
      const payload = this.googleCalendar.verifyState(input.state);
      this.logger.log(
        `[callback] exchanging storeId=${payload.storeId} agentId=${payload.agentId}`,
      );
      await this.googleCalendar.exchangeCodeAndConnect({
        code: input.code.trim(),
        storeId: payload.storeId,
        agentId: payload.agentId,
      });
      this.logger.log(
        `[callback] success storeId=${payload.storeId} agentId=${payload.agentId} googleCalendarEnabled=true`,
      );
      return {
        redirectUrl: this.googleCalendar.frontendRedirectUrl({
          connected: 'true',
        }),
      };
    } catch (error) {
      this.logger.error(
        `[callback] oauth_failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        redirectUrl: this.googleCalendar.frontendRedirectUrl({
          connected: 'error',
          reason: 'oauth_failed',
        }),
      };
    }
  }
}
