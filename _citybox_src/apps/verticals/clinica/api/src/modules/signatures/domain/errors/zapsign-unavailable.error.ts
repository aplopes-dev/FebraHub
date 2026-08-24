import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

export class ZapSignUnavailableError extends InfrastructureError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `ZapSign unavailable: ${reason}`,
      externalMessage:
        'Serviço de assinatura eletrônica indisponível no momento',
      context,
    });
  }
}
