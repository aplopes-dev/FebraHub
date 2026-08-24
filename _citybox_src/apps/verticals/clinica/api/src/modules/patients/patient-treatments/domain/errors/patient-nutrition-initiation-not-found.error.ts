import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientNutritionInitiationNotFoundError extends DomainError {
  constructor(context: string, evolutionId: string) {
    super({
      internalMessage: `Nutrition initiation not found for evolution ${evolutionId}`,
      externalMessage: 'Inicialização nutricional não encontrada',
      context,
    });
  }
}
