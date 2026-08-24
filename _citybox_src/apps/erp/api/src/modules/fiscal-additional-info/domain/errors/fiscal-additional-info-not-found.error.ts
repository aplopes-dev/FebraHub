import { DomainError } from '../../../../shared/core/errors/domain.error';

export class FiscalAdditionalInfoNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `FiscalAdditionalInfo ${id} not found`,
      externalMessage: 'Informação adicional não encontrada.',
      context: FiscalAdditionalInfoNotFoundError.name,
    });
  }
}
