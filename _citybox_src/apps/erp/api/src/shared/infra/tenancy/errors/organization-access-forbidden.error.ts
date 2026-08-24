import { DomainError } from '../../../core/errors/domain.error';

/**
 * O usuário está autenticado, mas não é membro ativo da organização pedida no
 * header `X-Organization-Id`.
 *
 * A mensagem externa não distingue "organização não existe" de "você não é
 * membro" de propósito: a diferença revelaria a existência de outro tenant.
 */
export class OrganizationAccessForbiddenError extends DomainError {
  constructor(organizationId: string, userId: string) {
    super({
      internalMessage: `User ${userId} has no active membership in organization ${organizationId}`,
      externalMessage: 'Você não tem acesso a esta organização',
      context: OrganizationAccessForbiddenError.name,
    });
  }
}
