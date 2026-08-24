import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosCashSessionNotOpenError extends DomainError {
  constructor(sessionId: string) {
    super({
      internalMessage: `PosCashSession ${sessionId} is not open`,
      externalMessage:
        'Esta sessão de caixa não está aberta. Não é possível lançar movimentos nem fechá-la novamente.',
      context: PosCashSessionNotOpenError.name,
    });
  }
}
