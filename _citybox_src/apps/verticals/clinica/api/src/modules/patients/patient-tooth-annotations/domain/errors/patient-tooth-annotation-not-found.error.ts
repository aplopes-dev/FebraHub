import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientToothAnnotationNotFoundError extends DomainError {
  constructor(context: string, annotationId: string) {
    super({
      internalMessage: `Patient tooth annotation not found: ${annotationId}`,
      externalMessage: 'Anotação do dente não encontrada',
      context,
    });
  }
}
