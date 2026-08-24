import { DomainError } from '../../../core/errors/domain.error';

/** A organização existe e o usuário é membro, mas ela está suspensa ou inativa. */
export class OrganizationInactiveForbiddenError extends DomainError {
  constructor(organizationId: string, status: string) {
    super({
      internalMessage: `Organization ${organizationId} is ${status}`,
      externalMessage:
        'Esta organização está inativa. Fale com o responsável pela conta.',
      context: OrganizationInactiveForbiddenError.name,
    });
  }
}
