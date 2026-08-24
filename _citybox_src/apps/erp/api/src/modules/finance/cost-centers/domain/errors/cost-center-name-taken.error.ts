import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CostCenterNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Cost center name ${name} already used in this organization`,
      externalMessage:
        'Já existe um centro de custo com este nome nesta organização',
      context: CostCenterNameTakenError.name,
    });
  }
}
