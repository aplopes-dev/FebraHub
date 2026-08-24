import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PermissionProfileNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `PermissionProfile ${id} not found in the current organization`,
      externalMessage: 'Perfil de acesso não encontrado',
      context: PermissionProfileNotFoundError.name,
    });
  }
}
