import { DomainError } from '../../../../shared/core/errors/domain.error';

export class VariationInUseError extends DomainError {
  constructor(name: string, productCount: number) {
    super({
      internalMessage: `Variation ${name} has ${productCount} linked products`,
      externalMessage: `A variação "${name}" possui ${productCount} produto(s) vinculado(s) e não pode ser excluída`,
      context: VariationInUseError.name,
    });
  }
}
