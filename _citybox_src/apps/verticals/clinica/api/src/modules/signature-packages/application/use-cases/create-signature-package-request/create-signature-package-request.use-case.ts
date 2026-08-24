import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';
import { SignaturePackageRequestRepository } from '../../../domain/repositories/signature-package-request.repository.interface';
import { InvalidSignaturePackageError } from '../../../domain/errors/invalid-signature-package.error';
import { SignaturePackageRequestAlreadyPendingError } from '../../../domain/errors/signature-package-request-already-pending.error';
import { findSignaturePackageById } from '../../../domain/signature-package-catalog';

export type CreateSignaturePackageRequestInput = {
  storeId: string;
  packageId: string;
};

@Injectable()
export class CreateSignaturePackageRequestUseCase
  implements
    IUseCase<CreateSignaturePackageRequestInput, SignaturePackageRequest>
{
  constructor(
    private readonly requestRepository: SignaturePackageRequestRepository,
  ) {}

  async execute(
    input: CreateSignaturePackageRequestInput,
  ): Promise<SignaturePackageRequest> {
    const catalogEntry = findSignaturePackageById(input.packageId);
    if (!catalogEntry) {
      throw new InvalidSignaturePackageError(
        CreateSignaturePackageRequestUseCase.name,
        input.packageId,
      );
    }

    const existing = await this.requestRepository.findAllByStoreId(
      input.storeId,
    );
    const hasPending = existing.some(
      (item) =>
        item.packageId === catalogEntry.id && item.status === 'pending',
    );
    if (hasPending) {
      throw new SignaturePackageRequestAlreadyPendingError(
        CreateSignaturePackageRequestUseCase.name,
        catalogEntry.id,
      );
    }

    const request = SignaturePackageRequest.create({
      storeId: input.storeId,
      packageId: catalogEntry.id,
      quantity: catalogEntry.quantity,
      priceCents: catalogEntry.priceCents,
    });

    return this.requestRepository.save(request);
  }
}
