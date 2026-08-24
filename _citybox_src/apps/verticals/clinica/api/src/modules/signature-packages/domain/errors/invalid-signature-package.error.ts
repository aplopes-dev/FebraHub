import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidSignaturePackageError extends DomainError {
  constructor(context: string, packageId: string) {
    super({
      internalMessage: `Invalid signature package id "${packageId}"`,
      externalMessage: 'Pacote de assinatura inválido',
      context,
    });
  }
}
