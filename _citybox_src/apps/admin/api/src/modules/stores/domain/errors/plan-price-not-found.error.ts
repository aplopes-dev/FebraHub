import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PlanPriceNotFoundError extends DomainError {
  constructor(context: string, planId: string, cycle: string) {
    super({
      internalMessage: `PlanPrice not found for plan "${planId}" and cycle "${cycle}"`,
      externalMessage: 'Preço não encontrado para o plano e ciclo selecionados',
      context,
    });
  }
}
