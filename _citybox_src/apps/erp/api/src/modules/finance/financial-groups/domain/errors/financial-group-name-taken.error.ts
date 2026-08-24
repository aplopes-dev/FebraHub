import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialGroupNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Financial group name ${name} already used in this organization`,
      externalMessage:
        'Já existe um grupo financeiro com este nome nesta organização',
      context: FinancialGroupNameTakenError.name,
    });
  }
}
