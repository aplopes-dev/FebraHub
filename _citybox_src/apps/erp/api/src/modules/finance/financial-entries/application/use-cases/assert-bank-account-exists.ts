import { BankAccountRepository } from '../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import { BankAccountNotFoundError } from '../../../bank-accounts/domain/errors/bank-account-not-found.error';

/**
 * Confere que a conta bancária informada existe, é da organização ativa e não
 * está excluída.
 *
 * Sem esta checagem, um `bankAccountId` inválido só estouraria na FK composta do
 * banco: 500 em vez de 404, e sem dizer qual id era o problema. A conta
 * excluída também é recusada — o lançamento novo não deve nascer amarrado a uma
 * conta que saiu de operação.
 */
export async function assertBankAccountExists(
  bankAccountRepository: BankAccountRepository,
  organizationId: string,
  bankAccountId: string | null | undefined,
): Promise<string | null> {
  if (!bankAccountId) return null;

  const bankAccount = await bankAccountRepository.findById(
    organizationId,
    bankAccountId,
  );
  if (!bankAccount || bankAccount.deletedAt) {
    throw new BankAccountNotFoundError(bankAccountId);
  }

  return bankAccountId;
}
