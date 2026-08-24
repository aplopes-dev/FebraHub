import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Produto tipo supply (ou outro inelegível) não pode ter ficha técnica. */
export class TechnicalSheetNotEligibleError extends DomainError {
  constructor(productId: string) {
    super({
      internalMessage: `Product ${productId} is not eligible for a technical sheet`,
      externalMessage:
        'Produtos do tipo insumo não possuem ficha técnica. Cadastre a receita no produto acabado.',
      context: TechnicalSheetNotEligibleError.name,
    });
  }
}
