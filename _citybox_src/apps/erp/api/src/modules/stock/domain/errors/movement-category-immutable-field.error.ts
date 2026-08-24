import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Campos protegidos em categoria de sistema (`type`, `code`, `systemKey`).
 * O filtro HTTP mapeia sufixo `ImmutableField` → 400.
 */
export class MovementCategoryImmutableFieldError extends DomainError {
  constructor(field: string) {
    super({
      internalMessage: `MovementCategory field "${field}" is immutable for system categories`,
      externalMessage: `O campo "${field}" não pode ser alterado em categorias de sistema.`,
      context: MovementCategoryImmutableFieldError.name,
    });
  }
}
