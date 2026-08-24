import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ReferencedProfessionalNotFoundError extends DomainError {
  constructor(ids: string[]) {
    const list = ids.join(', ');
    super({
      internalMessage: `Professional(s) not found: ${list}`,
      externalMessage:
        'Um ou mais profissionais selecionados não foram encontrados.',
      context: 'Appointments',
    });
  }
}
