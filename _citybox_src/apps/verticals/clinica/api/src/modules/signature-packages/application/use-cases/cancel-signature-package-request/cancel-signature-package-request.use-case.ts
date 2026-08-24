import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';
import { SignaturePackageRequestRepository } from '../../../domain/repositories/signature-package-request.repository.interface';
import { SignaturePackageRequestNotFoundError } from '../../../domain/errors/signature-package-request-not-found.error';
import { SignaturePackageRequestNotPendingError } from '../../../domain/errors/signature-package-request-not-pending.error';

export type CancelSignaturePackageRequestInput = {
  storeId: string;
  id: string;
};

@Injectable()
export class CancelSignaturePackageRequestUseCase
  implements
    IUseCase<CancelSignaturePackageRequestInput, SignaturePackageRequest>
{
  constructor(
    private readonly requestRepository: SignaturePackageRequestRepository,
  ) {}

  async execute(
    input: CancelSignaturePackageRequestInput,
  ): Promise<SignaturePackageRequest> {
    const existing = await this.requestRepository.findById(
      input.storeId,
      input.id,
    );
    if (!existing) {
      throw new SignaturePackageRequestNotFoundError(
        CancelSignaturePackageRequestUseCase.name,
        input.id,
      );
    }

    if (existing.status === 'cancelado') {
      return existing;
    }

    if (existing.status !== 'pending') {
      throw new SignaturePackageRequestNotPendingError(
        CancelSignaturePackageRequestUseCase.name,
        input.id,
      );
    }

    return this.requestRepository.save(existing.withCancelled());
  }
}
