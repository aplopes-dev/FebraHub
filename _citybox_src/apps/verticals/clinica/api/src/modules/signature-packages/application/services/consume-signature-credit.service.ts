import { Injectable } from '@nestjs/common';
import { SignatureCreditBalance } from '../../domain/entities/signature-credit-balance.entity';
import { SignatureCreditBalanceRepository } from '../../domain/repositories/signature-credit-balance.repository.interface';
import { SIGNATURE_CREDIT_SEED_BALANCE } from '../../domain/signature-package-catalog';

/** Debita/reembolsa créditos de assinatura eletrônica (1 PDF ZapSign = 1 crédito). */
@Injectable()
export class ConsumeSignatureCreditService {
  constructor(
    private readonly creditBalanceRepository: SignatureCreditBalanceRepository,
  ) {}

  async consume(storeId: string, quantity = 1): Promise<SignatureCreditBalance> {
    await this.ensureBalanceRow(storeId);
    return this.creditBalanceRepository.debitOrFail(storeId, quantity);
  }

  async refund(storeId: string, quantity = 1): Promise<SignatureCreditBalance> {
    const existing =
      await this.creditBalanceRepository.findByStoreId(storeId);
    if (!existing) {
      return this.creditBalanceRepository.save(
        SignatureCreditBalance.create({
          storeId,
          balance: quantity,
        }),
      );
    }
    return this.creditBalanceRepository.save(
      existing.withAddedCredits(quantity),
    );
  }

  private async ensureBalanceRow(storeId: string): Promise<void> {
    const existing =
      await this.creditBalanceRepository.findByStoreId(storeId);
    if (existing) return;
    await this.creditBalanceRepository.save(
      SignatureCreditBalance.create({
        storeId,
        balance: SIGNATURE_CREDIT_SEED_BALANCE,
      }),
    );
  }
}
