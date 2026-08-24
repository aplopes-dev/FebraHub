import { DomainError } from '../../../core/errors/domain.error';

/**
 * A filial pedida em `X-Branch-Id` não existe na organização ativa ou não está
 * entre as que o membro pode operar.
 */
export class BranchAccessForbiddenError extends DomainError {
  constructor(branchId: string, membershipId: string) {
    super({
      internalMessage: `Membership ${membershipId} cannot operate branch ${branchId}`,
      externalMessage: 'Você não tem acesso a esta unidade',
      context: BranchAccessForbiddenError.name,
    });
  }
}
