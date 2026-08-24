import { DomainError } from '../../../../shared/core/errors/domain.error';

export class GoogleRefreshTokenMissingError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Google OAuth did not return a refresh_token',
      externalMessage:
        'Google não retornou refresh_token. Revogue o app em myaccount.google.com/permissions e reconecte.',
      context,
    });
  }
}
