import { DomainError } from '../../../../shared/core/errors/domain.error';

export class DocumentContextForbiddenError extends DomainError {
  constructor(context: string, detail: string) {
    super({
      internalMessage: detail,
      externalMessage: 'Não é possível gerar este documento neste contexto.',
      context,
    });
  }
}
