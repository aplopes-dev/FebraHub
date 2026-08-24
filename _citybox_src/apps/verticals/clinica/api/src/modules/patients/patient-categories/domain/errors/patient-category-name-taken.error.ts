import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientCategoryNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `Patient category name taken: ${name}`,
      externalMessage: 'Já existe uma categoria com este nome',
      context,
    });
  }
}
