import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidDocumentFolderError extends ValidatorDomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid document folder: ${value}`,
      externalMessage:
        'Pasta inválida. Use clientes, imóveis, conformidade legal ou contratos assinados',
      context,
    });
  }
}
