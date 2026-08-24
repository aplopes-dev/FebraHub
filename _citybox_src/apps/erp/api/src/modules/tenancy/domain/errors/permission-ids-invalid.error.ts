import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class PermissionIdsInvalidError extends ValidatorDomainError {
  constructor(detail: string) {
    super({
      internalMessage: detail,
      externalMessage:
        'Uma ou mais permissões informadas não existem no catálogo',
      context: PermissionIdsInvalidError.name,
    });
  }
}
