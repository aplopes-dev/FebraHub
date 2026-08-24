import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';

/**
 * Confere que cada unidade informada existe e é da organização ativa.
 *
 * Sem isso, um `branchId` de outra empresa passaria pela aplicação e só
 * estouraria na FK composta do banco — 500 em vez de 404, e sem dizer qual id
 * era o problema. Mesma checagem de `CreateMemberUseCase`.
 */
export async function assertBranchesBelongToOrganization(
  branchRepository: BranchRepository,
  organizationId: string,
  branchIds: readonly string[] = [],
): Promise<string[]> {
  const unique = [...new Set(branchIds.filter(Boolean))];

  for (const branchId of unique) {
    const branch = await branchRepository.findById(organizationId, branchId);
    if (!branch || branch.deletedAt) throw new BranchNotFoundError(branchId);
  }

  return unique;
}
