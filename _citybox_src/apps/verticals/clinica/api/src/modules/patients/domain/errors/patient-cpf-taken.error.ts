import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PatientCpfTakenError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `CPF already registered for store: ${storeId}`,
      externalMessage: 'CPF já cadastrado para esta clínica',
      context,
    });
  }
}
