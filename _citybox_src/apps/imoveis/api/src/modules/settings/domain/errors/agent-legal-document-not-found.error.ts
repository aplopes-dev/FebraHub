import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AgentLegalDocumentNotFoundError extends DomainError {
  constructor(context: string, kind: string) {
    super({
      internalMessage: `Agent legal document not found: ${kind}`,
      externalMessage: 'Documento do corretor não encontrado',
      context,
    });
  }
}
