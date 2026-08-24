import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Encerrar a própria sessão é feito pelo logout, não por esta rota. */
export class CurrentSessionForbiddenError extends DomainError {
  constructor(context: string, sessionId: string) {
    super({
      internalMessage: `Cannot revoke the current session: ${sessionId}`,
      externalMessage: 'Não é possível encerrar a sessão atual por aqui',
      context,
    });
  }
}
