import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MovementCategoryNotRemovableError extends DomainError {
  constructor(id: string, reason: 'system' | 'inUse' = 'system') {
    const isSystem = reason === 'system';
    super({
      internalMessage: isSystem
        ? `MovementCategory ${id} is a system category and cannot be deleted`
        : `MovementCategory ${id} is referenced by stock movements and cannot be deleted`,
      externalMessage: isSystem
        ? 'Categorias de sistema não podem ser excluídas.'
        : 'Esta categoria já foi usada em movimentações e não pode ser excluída. Ela é necessária para manter o histórico do estoque.',
      context: MovementCategoryNotRemovableError.name,
    });
  }
}
