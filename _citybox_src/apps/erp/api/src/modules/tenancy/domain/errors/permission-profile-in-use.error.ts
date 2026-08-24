import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PermissionProfileInUseError extends DomainError {
  constructor(name: string, membershipCount: number) {
    super({
      internalMessage: `PermissionProfile ${name} has ${membershipCount} linked memberships`,
      externalMessage: `O perfil "${name}" possui ${membershipCount} membro(s) vinculado(s) e não pode ser excluído`,
      context: PermissionProfileInUseError.name,
    });
  }
}
