import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientBodyRegionAnnotationNotFoundError extends DomainError {
  constructor(context: string, annotationId: string) {
    super({
      internalMessage: `Patient body region annotation not found: ${annotationId}`,
      externalMessage: 'Anotação da região não encontrada',
      context,
    });
  }
}
