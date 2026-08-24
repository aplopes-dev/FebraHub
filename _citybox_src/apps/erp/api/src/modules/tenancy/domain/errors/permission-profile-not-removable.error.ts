import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PermissionProfileNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `PermissionProfile ${id} is provisioned by the system and cannot be deleted`,
      externalMessage: 'Perfis de acesso do sistema não podem ser excluídos.',
      context: PermissionProfileNotRemovableError.name,
    });
  }
}
