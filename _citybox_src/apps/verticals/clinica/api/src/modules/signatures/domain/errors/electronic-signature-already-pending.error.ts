import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ElectronicSignatureAlreadyPendingError extends DomainError {
  constructor(context: string, targetId: string) {
    super({
      internalMessage: `Electronic signature already pending for target: ${targetId}`,
      externalMessage:
        'Já existe uma solicitação de assinatura pendente para este documento',
      context,
    });
  }
}
