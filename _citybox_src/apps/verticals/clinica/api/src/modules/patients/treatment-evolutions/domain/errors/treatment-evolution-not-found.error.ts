import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class TreatmentEvolutionNotFoundError extends DomainError {
  constructor(context: string, evolutionId: string) {
    super({
      internalMessage: `Treatment evolution not found: ${evolutionId}`,
      externalMessage: 'Evolução não encontrada',
      context,
    });
  }
}
