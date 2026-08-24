import { InfrastructureError } from '../../core/errors/infrastructure.error';

export class CepProviderUnavailableError extends InfrastructureError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `CEP provider unavailable: ${reason}`,
      externalMessage:
        'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.',
      context,
    });
  }
}
