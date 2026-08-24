import { FinancialGroupRepository } from '../../../financial-groups/domain/repositories/financial-group.repository.interface';
import { FinancialGroupNotFoundError } from '../../../financial-groups/domain/errors/financial-group-not-found.error';
import type { ChartOfAccountFinancialGroupType } from '../../domain/repositories/chart-of-account.repository.interface';

export type ResolvedFinancialGroup = {
  name: string;
  type: ChartOfAccountFinancialGroupType;
};

/**
 * Confere que o grupo financeiro existe, é da organização ativa e não está
 * excluído — e devolve o que a resposta precisa exibir dele.
 *
 * Sem esta checagem, um `financialGroupId` inválido só estouraria na FK composta
 * do banco: 500 em vez de 404, e sem dizer qual id era o problema.
 */
export async function assertFinancialGroupExists(
  financialGroupRepository: FinancialGroupRepository,
  organizationId: string,
  financialGroupId: string,
): Promise<ResolvedFinancialGroup> {
  const group = await financialGroupRepository.findById(
    organizationId,
    financialGroupId,
  );
  if (!group || group.deletedAt) {
    throw new FinancialGroupNotFoundError(financialGroupId);
  }

  return { name: group.name, type: group.type };
}
