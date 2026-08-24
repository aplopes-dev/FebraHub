import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * O evento da plataforma não trouxe um campo exigido para nascer o responsável.
 * A mensagem externa vai inteira para o callback `provisioning.failed`.
 */
export class StorePayloadIncompleteError extends DomainError {
  constructor(storeId: string, missingFields: readonly string[]) {
    const fields = missingFields.join(', ');
    super({
      internalMessage: `Store ${storeId} event is missing required fields: ${fields}`,
      externalMessage: `A loja não pode ser provisionada em Imóveis: faltam os campos ${fields}. Preencha-os no cadastro da loja e reprocesse o provisionamento.`,
      context: StorePayloadIncompleteError.name,
    });
  }
}
