import { DomainError } from '../../../../shared/core/errors/domain.error';

/** `sellerId` informado não é um usuário vendedor ativo da organização. */
export class PosSaleSellerInvalidError extends DomainError {
  constructor(sellerId: string) {
    super({
      internalMessage: `Seller ${sellerId} is missing, inactive or not marked as isSeller`,
      externalMessage:
        'Vendedor inválido. Escolha um usuário vendedor ativo da empresa.',
      context: PosSaleSellerInvalidError.name,
    });
  }
}
