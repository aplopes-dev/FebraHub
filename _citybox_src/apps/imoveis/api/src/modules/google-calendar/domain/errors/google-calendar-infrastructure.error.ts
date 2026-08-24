import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

export class GoogleCalendarInfrastructureError extends InfrastructureError {
  constructor(context: string, detail: string) {
    super({
      internalMessage: detail,
      externalMessage:
        'Integração Google Calendar não disponível. Verifique a configuração do servidor.',
      context,
    });
  }
}
