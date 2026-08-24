import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientContractEmissionNotFoundError extends DomainError {
  constructor(context: string, contractId: string) {
    super({
      internalMessage: `Patient contract emission not found: ${contractId}`,
      externalMessage: 'Contrato não encontrado',
      context,
    });
  }
}
