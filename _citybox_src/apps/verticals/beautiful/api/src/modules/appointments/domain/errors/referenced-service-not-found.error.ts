import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ReferencedServiceNotFoundError extends DomainError {
  constructor(ids: string[]) {
    const list = ids.join(', ');
    super({
      internalMessage: `Service(s) not found: ${list}`,
      externalMessage:
        'Um ou mais serviços selecionados não foram encontrados.',
      context: 'Appointments',
    });
  }
}
