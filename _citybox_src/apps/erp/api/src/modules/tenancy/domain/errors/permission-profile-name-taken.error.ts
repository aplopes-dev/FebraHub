import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PermissionProfileNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Permission profile name ${name} already used in this organization`,
      externalMessage:
        'Já existe um perfil de acesso com este nome nesta organização',
      context: PermissionProfileNameTakenError.name,
    });
  }
}
