import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class TreatmentEvolutionConfirmedError extends DomainError {
  constructor(context: string, evolutionId: string) {
    super({
      internalMessage: `Treatment evolution is confirmed: ${evolutionId}`,
      externalMessage: 'Evolução confirmada não pode ser alterada',
      context,
    });
  }
}
