import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientNutritionNoteNotFoundError extends DomainError {
  constructor(context: string, noteId: string) {
    super({
      internalMessage: `Patient nutrition note not found: ${noteId}`,
      externalMessage: 'Nota não encontrada',
      context,
    });
  }
}
