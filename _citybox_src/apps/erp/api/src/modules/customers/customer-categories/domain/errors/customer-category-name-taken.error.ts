import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CustomerCategoryNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Customer category name ${name} already used in this organization`,
      externalMessage:
        'Já existe uma categoria com este nome nesta organização',
      context: CustomerCategoryNameTakenError.name,
    });
  }
}
