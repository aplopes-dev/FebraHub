import { InfrastructureError } from '../../../shared/core/errors/infrastructure.error';

export class ProviderNotConfiguredError extends InfrastructureError {
  constructor(context: string, type: string) {
    super({
      internalMessage: `Fiscal provider "${type}" is not registered`,
      externalMessage: 'Provider fiscal não configurado',
      context,
    });
  }
}
