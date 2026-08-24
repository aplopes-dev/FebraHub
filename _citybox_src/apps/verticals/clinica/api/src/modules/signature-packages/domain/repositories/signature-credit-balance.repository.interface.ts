import type { SignatureCreditBalance } from '../entities/signature-credit-balance.entity';

export abstract class SignatureCreditBalanceRepository {
  abstract findByStoreId(
    storeId: string,
  ): Promise<SignatureCreditBalance | null>;

  abstract save(
    balance: SignatureCreditBalance,
  ): Promise<SignatureCreditBalance>;

  /**
   * Debita atomicamente se `balance >= quantity`.
   * Lança `SignatureCreditsInsufficientError` se saldo insuficiente ou linha ausente.
   */
  abstract debitOrFail(
    storeId: string,
    quantity: number,
  ): Promise<SignatureCreditBalance>;
}
