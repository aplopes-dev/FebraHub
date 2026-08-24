import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UnitOfMeasureAbbreviationTakenError extends DomainError {
  constructor(abbreviation: string) {
    super({
      internalMessage: `Unit of measure abbreviation ${abbreviation} already taken in this organization`,
      externalMessage: `Já existe uma unidade com a sigla "${abbreviation}"`,
      context: UnitOfMeasureAbbreviationTakenError.name,
    });
  }
}
