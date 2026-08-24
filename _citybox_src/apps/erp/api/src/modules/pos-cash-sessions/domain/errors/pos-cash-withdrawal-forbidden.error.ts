import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosCashWithdrawalForbiddenError extends DomainError {
  constructor() {
    super({
      internalMessage:
        'Operator lacks pdv.operacao.caixa.withdrawal and no authorizedBy with permission',
      externalMessage:
        'Sem permissão para sangria. Solicite autorização de um supervisor.',
      context: PosCashWithdrawalForbiddenError.name,
    });
  }
}
