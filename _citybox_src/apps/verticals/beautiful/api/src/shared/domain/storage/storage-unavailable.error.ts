import { InfrastructureError } from '../../core/errors/infrastructure.error';

export class StorageUnavailableError extends InfrastructureError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Object storage unavailable: ${reason}`,
      externalMessage:
        'Armazenamento de arquivos indisponível no momento. Tente novamente em instantes.',
      context,
    });
  }
}
