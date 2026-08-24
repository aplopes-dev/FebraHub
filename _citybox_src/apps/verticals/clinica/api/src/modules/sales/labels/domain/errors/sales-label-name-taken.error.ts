import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesLabelNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `Sales label name taken: ${name}`,
      externalMessage: 'Já existe um rótulo com este nome',
      context,
    });
  }
}
