import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ContractModelHasPatientsError extends DomainError {
  constructor(context: string, modelId: string) {
    super({
      internalMessage: `Contract model has patient emissions: ${modelId}`,
      externalMessage:
        'Este modelo de contrato já foi utilizado por paciente(s) e não pode ser removido.',
      context,
    });
  }
}
