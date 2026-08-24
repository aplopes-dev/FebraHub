import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TemplateNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `AnamnesisTemplate ${id} not found for store`,
      externalMessage: 'Modelo de anamnese não encontrado',
      context,
    });
  }
}
