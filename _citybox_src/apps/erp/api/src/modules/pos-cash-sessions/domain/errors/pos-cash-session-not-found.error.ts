import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosCashSessionNotFoundError extends DomainError {
  constructor(sessionId?: string) {
    super({
      internalMessage: sessionId
        ? `PosCashSession ${sessionId} not found`
        : 'PosCashSession not found',
      externalMessage: 'Sessão de caixa não encontrada.',
      context: PosCashSessionNotFoundError.name,
    });
  }
}
