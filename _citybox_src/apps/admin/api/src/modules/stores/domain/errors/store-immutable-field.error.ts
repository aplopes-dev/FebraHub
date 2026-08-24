import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreImmutableFieldError extends DomainError {
  constructor(context: string, field: string) {
    super({
      internalMessage: `Field "${field}" cannot be changed after store creation`,
      externalMessage: `O campo ${field} não pode ser alterado após a criação da loja`,
      context,
    });
  }
}
