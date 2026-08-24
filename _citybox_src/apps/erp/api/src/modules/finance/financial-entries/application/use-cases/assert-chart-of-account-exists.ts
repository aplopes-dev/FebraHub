import { ChartOfAccountRepository } from '../../../chart-of-accounts/domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccountNotFoundError } from '../../../chart-of-accounts/domain/errors/chart-of-account-not-found.error';

/**
 * Confere que a conta do plano de contas informada numa linha de rateio
 * existe, é da organização ativa e não está excluída.
 *
 * Sem esta checagem, um `chartOfAccountId` inválido só estouraria na FK
 * `onDelete: Restrict` do banco: 500 em vez de 404.
 */
export async function assertChartOfAccountExists(
  chartOfAccountRepository: ChartOfAccountRepository,
  organizationId: string,
  chartOfAccountId: string,
): Promise<string> {
  const account = await chartOfAccountRepository.findById(
    organizationId,
    chartOfAccountId,
  );
  if (!account || account.deletedAt) {
    throw new ChartOfAccountNotFoundError(chartOfAccountId);
  }

  return chartOfAccountId;
}
