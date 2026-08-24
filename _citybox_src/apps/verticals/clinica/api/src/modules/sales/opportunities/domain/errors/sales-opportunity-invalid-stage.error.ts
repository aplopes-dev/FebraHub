import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesOpportunityInvalidStageError extends DomainError {
  constructor(context: string, stageId: string) {
    super({
      internalMessage: `Stage does not belong to opportunity funnel: ${stageId}`,
      externalMessage: 'Etapa inválida para este funil',
      context,
    });
  }
}
