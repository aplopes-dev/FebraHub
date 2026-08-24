import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientBodyMetricNotFoundError extends DomainError {
  constructor(context: string, metricId: string) {
    super({
      internalMessage: `Patient body metric not found: ${metricId}`,
      externalMessage: 'Medição corporal não encontrada',
      context,
    });
  }
}
