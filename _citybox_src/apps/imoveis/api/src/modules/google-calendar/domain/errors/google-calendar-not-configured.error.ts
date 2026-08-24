import { DomainError } from '../../../../shared/core/errors/domain.error';

export class GoogleCalendarNotConfiguredError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage:
        'Google Calendar env missing (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)',
      externalMessage:
        'Google Calendar não está configurado neste ambiente. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI.',
      context,
    });
  }
}
