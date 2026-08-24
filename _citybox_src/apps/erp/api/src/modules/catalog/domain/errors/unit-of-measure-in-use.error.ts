import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UnitOfMeasureInUseError extends DomainError {
  constructor(abbreviation: string, productCount: number) {
    super({
      internalMessage: `UnitOfMeasure ${abbreviation} is used by ${productCount} product(s)`,
      externalMessage: `A unidade "${abbreviation}" está vinculada a ${productCount} produto(s) e não pode ser excluída`,
      context: UnitOfMeasureInUseError.name,
    });
  }
}
