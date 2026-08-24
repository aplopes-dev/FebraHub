import type { FinancialEntry } from '../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../domain/errors/financial-entry-not-found.error';

/**
 * Confere que o lançamento existe e pertence à organização ativa — pré-
 * requisito das 3 rotas de anexo (molde de `assertCardContractExists`).
 * Inclui o excluído de propósito: um lançamento excluído continua podendo
 * ter comprovantes consultados/removidos.
 */
export async function assertFinancialEntryExists(
  financialEntryRepository: FinancialEntryRepository,
  organizationId: string,
  financialEntryId: string,
): Promise<FinancialEntry> {
  const entry = await financialEntryRepository.findById(
    organizationId,
    financialEntryId,
  );
  if (!entry) throw new FinancialEntryNotFoundError(financialEntryId);

  return entry;
}
