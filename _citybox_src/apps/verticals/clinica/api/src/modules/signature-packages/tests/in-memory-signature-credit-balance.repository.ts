import { SignatureCreditBalance } from '../domain/entities/signature-credit-balance.entity';
import { SignatureCreditsInsufficientError } from '../domain/errors/signature-credits-insufficient.error';
import { SignatureCreditBalanceRepository } from '../domain/repositories/signature-credit-balance.repository.interface';

export class InMemorySignatureCreditBalanceRepository extends SignatureCreditBalanceRepository {
  private items = new Map<string, SignatureCreditBalance>();

  findByStoreId(storeId: string): Promise<SignatureCreditBalance | null> {
    return Promise.resolve(this.items.get(storeId) ?? null);
  }

  save(balance: SignatureCreditBalance): Promise<SignatureCreditBalance> {
    this.items.set(balance.storeId, balance);
    return Promise.resolve(balance);
  }

  async debitOrFail(
    storeId: string,
    quantity: number,
  ): Promise<SignatureCreditBalance> {
    const current = this.items.get(storeId);
    if (!current || current.balance < quantity) {
      throw new SignatureCreditsInsufficientError(
        InMemorySignatureCreditBalanceRepository.name,
        current?.balance ?? 0,
        quantity,
      );
    }
    const next = current.withDebitedCredits(quantity);
    this.items.set(storeId, next);
    return next;
  }

  getAll(): SignatureCreditBalance[] {
    return [...this.items.values()];
  }

  clear(): void {
    this.items.clear();
  }
}
