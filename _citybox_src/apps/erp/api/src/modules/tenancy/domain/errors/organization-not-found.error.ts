import { DomainError } from '../../../../shared/core/errors/domain.error';

export class OrganizationNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Organization ${id} not found`,
      externalMessage: 'Organização não encontrada',
      context: OrganizationNotFoundError.name,
    });
  }
}
