import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientCertificateNotFoundError extends DomainError {
  constructor(context: string, certificateId: string) {
    super({
      internalMessage: `Patient certificate not found: ${certificateId}`,
      externalMessage: 'Atestado não encontrado',
      context,
    });
  }
}
