import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidClinicStrandError extends DomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid clinicStrand "${value}"`,
      externalMessage: 'Vertente da clínica inválida',
      context,
    });
  }
}
