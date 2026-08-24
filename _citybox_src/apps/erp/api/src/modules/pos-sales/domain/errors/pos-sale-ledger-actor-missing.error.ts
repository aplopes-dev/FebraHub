import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSaleLedgerActorMissingError extends DomainError {
  constructor() {
    super({
      internalMessage:
        'Organization has no membership user to attribute stock movement from POS',
      externalMessage:
        'Não foi possível baixar o estoque: a empresa não tem usuário responsável cadastrado.',
      context: PosSaleLedgerActorMissingError.name,
    });
  }
}
