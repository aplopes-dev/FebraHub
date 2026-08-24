import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Só uma matriz por organização. A regra vive aqui, e não num unique parcial no
 * banco, porque índice parcial exigiria SQL manual (AGENTS.md §5.9).
 */
export class HeadquartersDuplicateError extends DomainError {
  constructor(existingCode: string) {
    super({
      internalMessage: `Organization already has a headquarters branch (${existingCode})`,
      externalMessage: `A unidade "${existingCode}" já é a matriz desta organização`,
      context: HeadquartersDuplicateError.name,
    });
  }
}
