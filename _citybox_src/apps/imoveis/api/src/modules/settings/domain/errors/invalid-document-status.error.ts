import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidDocumentStatusError extends ValidatorDomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid document status: ${value}`,
      externalMessage: 'Status inválido. Use pendente, concluído ou arquivado',
      context,
    });
  }
}
