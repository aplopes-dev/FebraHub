import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TemplateNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `AnamnesisTemplate name "${name}" already exists for store`,
      externalMessage: 'Já existe um modelo de anamnese com esse nome',
      context,
    });
  }
}
