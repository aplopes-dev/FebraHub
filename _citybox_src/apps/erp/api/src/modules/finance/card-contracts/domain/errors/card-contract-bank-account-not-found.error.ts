import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * Erro próprio do módulo em vez de reusar o do `bank-accounts`: o contrato de
 * cartão fala com a conta bancária por uma porta local (`BankAccountLookup`) e
 * não depende daquele módulo — o erro segue a mesma fronteira.
 */
export class CardContractBankAccountNotFoundError extends DomainError {
  constructor(bankAccountId: string) {
    super({
      internalMessage: `Bank account ${bankAccountId} not found in the current organization`,
      externalMessage: 'Conta bancária não encontrada',
      context: CardContractBankAccountNotFoundError.name,
    });
  }
}
