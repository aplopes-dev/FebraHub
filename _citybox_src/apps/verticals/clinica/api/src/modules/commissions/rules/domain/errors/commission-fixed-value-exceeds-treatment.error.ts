import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** 422 — comissão em valor fixo maior que o valor do tratamento (sem permitir exceder). */
export class CommissionFixedValueExceedsTreatmentError extends DomainError {
  constructor(context: string, treatmentId: string) {
    super({
      internalMessage: `Fixed commission amount exceeds treatment value for treatment ${treatmentId}`,
      externalMessage:
        'O valor fixo da comissão não pode ser maior que o valor do tratamento',
      context,
    });
    this.name = 'CommissionFixedValueExceedsTreatmentError';
  }
}
