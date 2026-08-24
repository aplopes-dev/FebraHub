import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreSettingsNotFoundError extends DomainError {
  constructor(resource: string) {
    super({
      internalMessage: `Store settings resource not found: ${resource}`,
      externalMessage:
        resource === 'logo'
          ? 'Logotipo não encontrado.'
          : 'Configuração não encontrada.',
      context: 'StoreSettings',
    });
  }
}
