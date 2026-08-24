import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CustomerCategoryInUseError extends DomainError {
  constructor(name: string, customerCount: number) {
    super({
      internalMessage: `Customer category ${name} has ${customerCount} linked customers`,
      externalMessage: `A categoria "${name}" possui ${customerCount} cliente(s) vinculado(s) e não pode ser excluída`,
      context: CustomerCategoryInUseError.name,
    });
  }
}
