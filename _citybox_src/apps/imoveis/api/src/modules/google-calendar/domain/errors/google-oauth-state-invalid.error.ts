import { DomainError } from '../../../../shared/core/errors/domain.error';

export class GoogleOAuthStateInvalidError extends DomainError {
  constructor(context: string, reason = 'invalid') {
    super({
      internalMessage: `Google OAuth state invalid: ${reason}`,
      externalMessage:
        reason === 'expired'
          ? 'Sessão de autorização Google expirou. Tente conectar novamente.'
          : 'Falha na autorização Google. Tente conectar novamente.',
      context,
    });
  }
}
