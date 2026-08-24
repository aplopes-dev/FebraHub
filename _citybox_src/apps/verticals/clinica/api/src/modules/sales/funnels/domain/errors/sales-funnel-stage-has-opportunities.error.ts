import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesFunnelStageHasOpportunitiesError extends DomainError {
  constructor(context: string, stageId: string) {
    super({
      internalMessage: `Cannot remove funnel stage with opportunities: ${stageId}`,
      externalMessage: 'Não é possível remover etapa com oportunidades',
      context,
    });
  }
}
