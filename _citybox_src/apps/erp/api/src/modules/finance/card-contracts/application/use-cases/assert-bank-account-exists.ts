import { BankAccountLookup } from '../../domain/repositories/bank-account-lookup.interface';
import { CardContractBankAccountNotFoundError } from '../../domain/errors/card-contract-bank-account-not-found.error';

/**
 * Confere que a conta bancária informada existe, é da organização ativa e não
 * está excluída.
 *
 * Sem esta checagem, um `bankAccountId` inválido só estouraria na FK composta do
 * banco: 500 em vez de 404, e sem dizer qual id era o problema.
 */
export async function assertBankAccountExists(
  bankAccountLookup: BankAccountLookup,
  organizationId: string,
  bankAccountId: string | null | undefined,
): Promise<string | null> {
  if (!bankAccountId) return null;

  const exists = await bankAccountLookup.exists(organizationId, bankAccountId);
  if (!exists) {
    throw new CardContractBankAccountNotFoundError(bankAccountId);
  }

  return bankAccountId;
}
