import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidLegalDocumentKindError extends ValidatorDomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid legal document kind: ${value}`,
      externalMessage:
        'Tipo de documento inválido. Use licença, contrato ou seguro',
      context,
    });
  }
}
