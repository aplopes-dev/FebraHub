import { BankAccountRepository } from '../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import { BankAccountNotFoundError } from '../../../bank-accounts/domain/errors/bank-account-not-found.error';

/**
 * Confere que a conta bancária informada existe, é da organização ativa e não
 * está excluída — mesmo raciocínio de `financial-entries/application/use-cases/assert-bank-account-exists.ts`,
 * copiado aqui (não importado direto) para não atravessar a fronteira de
 * módulo além dos repositórios (únicos exports de `financial-entries`/
 * `bank-accounts` que este módulo deveria consumir).
 */
export async function assertBankAccountExists(
  bankAccountRepository: BankAccountRepository,
  organizationId: string,
  bankAccountId: string,
): Promise<string> {
  const bankAccount = await bankAccountRepository.findById(
    organizationId,
    bankAccountId,
  );
  if (!bankAccount || bankAccount.deletedAt) {
    throw new BankAccountNotFoundError(bankAccountId);
  }
  return bankAccountId;
}
