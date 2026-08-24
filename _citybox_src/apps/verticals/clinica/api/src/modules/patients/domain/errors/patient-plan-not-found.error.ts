import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PatientPlanNotFoundError extends DomainError {
  constructor(context: string, planId: string) {
    super({
      internalMessage: `Clinic plan not found for patient: ${planId}`,
      externalMessage: 'Plano de procedimento não encontrado',
      context,
    });
  }
}
