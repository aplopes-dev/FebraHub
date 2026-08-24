import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SignatureCreditBalance } from '../../../domain/entities/signature-credit-balance.entity';
import { SignatureCreditBalanceRepository } from '../../../domain/repositories/signature-credit-balance.repository.interface';
import { SIGNATURE_CREDIT_SEED_BALANCE } from '../../../domain/signature-package-catalog';

export type GetSignatureCreditsInput = {
  storeId: string;
};

@Injectable()
export class GetSignatureCreditsUseCase
  implements IUseCase<GetSignatureCreditsInput, SignatureCreditBalance>
{
  constructor(
    private readonly creditBalanceRepository: SignatureCreditBalanceRepository,
  ) {}

  async execute(
    input: GetSignatureCreditsInput,
  ): Promise<SignatureCreditBalance> {
    const existing = await this.creditBalanceRepository.findByStoreId(
      input.storeId,
    );
    if (existing) {
      return existing;
    }

    const seeded = SignatureCreditBalance.create({
      storeId: input.storeId,
      balance: SIGNATURE_CREDIT_SEED_BALANCE,
    });
    return this.creditBalanceRepository.save(seeded);
  }
}
