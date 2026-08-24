import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class ChartOfAccountNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Chart of account name ${name} already used in this organization`,
      externalMessage: 'Já existe uma conta com este nome nesta organização',
      context: ChartOfAccountNameTakenError.name,
    });
  }
}
