import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosCashSupervisorRequiredError extends DomainError {
  constructor(amountCents: number) {
    super({
      internalMessage: `Withdrawal of ${amountCents} cents requires supervisor authorization`,
      externalMessage:
        'Sangria acima do limite da alçada. Informe o autorizador (supervisor).',
      context: PosCashSupervisorRequiredError.name,
    });
  }
}
