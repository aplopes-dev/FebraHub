import { BankAccountRepository } from '../../../bank-accounts/domain/repositories/bank-account.repository.interface';

/**
 * Auto-detecção de conta bancária pelo código do banco do arquivo `.ofx`
 * (`BANKACCTFROM.BANKID`) — spec `007-financeiro-ajustes-ui` FR-007a/FR-007b.
 * Resolve só quando há exatamente 1 conta ativa da organização com esse
 * `bankCode`; 0 ou 2+ correspondências devolvem `null` (usuário escolhe
 * manualmente, sem bloquear o fluxo).
 */
export async function resolveBankAccountByCode(
  bankAccountRepository: BankAccountRepository,
  organizationId: string,
  bankCode: string,
): Promise<string | null> {
  const accounts = await bankAccountRepository.findActiveByBankCode(
    organizationId,
    bankCode,
  );
  return accounts.length === 1 ? accounts[0].id : null;
}
