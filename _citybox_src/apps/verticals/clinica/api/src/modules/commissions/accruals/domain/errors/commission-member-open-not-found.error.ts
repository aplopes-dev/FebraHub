import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CommissionMemberOpenNotFoundError extends DomainError {
  constructor(context: string, memberId: string) {
    super({
      internalMessage: `Open commissions not found for member: ${memberId}`,
      externalMessage: 'Comissões em aberto não encontradas para o profissional',
      context,
    });
    this.name = 'CommissionMemberOpenNotFoundError';
  }
}
