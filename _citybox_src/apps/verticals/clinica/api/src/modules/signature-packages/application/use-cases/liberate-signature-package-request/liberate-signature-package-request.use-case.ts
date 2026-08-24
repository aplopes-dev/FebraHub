import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';
import { SignatureCreditBalance } from '../../../domain/entities/signature-credit-balance.entity';
import { SignaturePackageRequestRepository } from '../../../domain/repositories/signature-package-request.repository.interface';
import { SignatureCreditBalanceRepository } from '../../../domain/repositories/signature-credit-balance.repository.interface';
import { SignaturePackageRequestNotFoundError } from '../../../domain/errors/signature-package-request-not-found.error';
import { SignaturePackageRequestNotPendingError } from '../../../domain/errors/signature-package-request-not-pending.error';
import { SIGNATURE_CREDIT_SEED_BALANCE } from '../../../domain/signature-package-catalog';

export type LiberateSignaturePackageRequestInput = {
  storeId: string;
  id: string;
};

@Injectable()
export class LiberateSignaturePackageRequestUseCase
  implements
    IUseCase<LiberateSignaturePackageRequestInput, SignaturePackageRequest>
{
  constructor(
    private readonly requestRepository: SignaturePackageRequestRepository,
    private readonly creditBalanceRepository: SignatureCreditBalanceRepository,
  ) {}

  async execute(
    input: LiberateSignaturePackageRequestInput,
  ): Promise<SignaturePackageRequest> {
    const existing = await this.requestRepository.findById(
      input.storeId,
      input.id,
    );
    if (!existing) {
      throw new SignaturePackageRequestNotFoundError(
        LiberateSignaturePackageRequestUseCase.name,
        input.id,
      );
    }

    // Idempotente: já liberado → devolve como está (sem creditar de novo)
    if (existing.status === 'liberado') {
      return existing;
    }

    if (existing.status !== 'pending') {
      throw new SignaturePackageRequestNotPendingError(
        LiberateSignaturePackageRequestUseCase.name,
        input.id,
      );
    }

    let balance = await this.creditBalanceRepository.findByStoreId(
      input.storeId,
    );
    if (!balance) {
      balance = SignatureCreditBalance.create({
        storeId: input.storeId,
        balance: SIGNATURE_CREDIT_SEED_BALANCE,
      });
    }

    const liberated = existing.withLiberated();
    const credited = balance.withAddedCredits(liberated.quantity);

    const result = await this.requestRepository.liberateAndCredit(
      liberated,
      credited,
    );
    return result.request;
  }
}
