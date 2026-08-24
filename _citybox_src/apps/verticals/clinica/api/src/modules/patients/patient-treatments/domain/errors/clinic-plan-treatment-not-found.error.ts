import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class ClinicPlanTreatmentNotFoundError extends DomainError {
  constructor(context: string, planId: string, treatmentId: string) {
    super({
      internalMessage: `Clinic plan treatment "${treatmentId}" not found in plan "${planId}"`,
      externalMessage: 'Procedimento do plano não encontrado',
      context,
    });
  }
}
