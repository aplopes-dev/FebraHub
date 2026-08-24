import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SignatureCreditsInsufficientError extends DomainError {
  constructor(context: string, available: number, requested: number) {
    super({
      internalMessage: `Insufficient signature credits. Available=${available} requested=${requested}`,
      externalMessage:
        'Saldo de assinaturas insuficiente. Solicite um pacote de assinatura eletrônica na Loja.',
      context,
    });
  }
}
