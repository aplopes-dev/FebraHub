import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PlanNotFoundError extends DomainError {
  constructor(context: string, planId: string) {
    super({
      internalMessage: `Plan "${planId}" not found`,
      externalMessage: 'Plano não encontrado',
      context,
    });
  }
}
