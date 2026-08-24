import { InfrastructureError } from '../../core/errors/infrastructure.error';

export class StorageUnavailableError extends InfrastructureError {
  constructor(context: string, cause?: string) {
    super({
      internalMessage: cause
        ? `Object storage unavailable: ${cause}`
        : 'Object storage unavailable',
      externalMessage:
        'Armazenamento de arquivos indisponível. Tente novamente.',
      context,
    });
  }
}
