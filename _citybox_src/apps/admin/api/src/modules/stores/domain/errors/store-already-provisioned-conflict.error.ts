import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreAlreadyProvisionedConflictError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Store "${storeId}" already ACTIVE — use reset-password`,
      externalMessage:
        'Esta loja já foi provisionada. Use "Gerar nova senha" para credenciais.',
      context,
    });
  }
}
