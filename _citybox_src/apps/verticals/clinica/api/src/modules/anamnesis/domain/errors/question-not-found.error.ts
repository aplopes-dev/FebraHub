import { DomainError } from '../../../../shared/core/errors/domain.error';

export class QuestionNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `AnamnesisQuestion ${id} not found or not accessible`,
      externalMessage: 'Pergunta de anamnese não encontrada',
      context,
    });
  }
}
