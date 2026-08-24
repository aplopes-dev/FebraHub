import { DomainError } from '../../../../shared/core/errors/domain.error';

export class DocumentTemplateNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Document template not found: id=${id}`,
      externalMessage: 'Modelo de documento não encontrado.',
      context: 'DocumentTemplateNotFoundError',
    });
  }
}
