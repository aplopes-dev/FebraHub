import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreVerticalNotSupportedError } from '../../../domain/errors/store-vertical-not-supported.error';
import {
  SignaturePackageProvisioning,
  type SignaturePackageRequestDto,
} from '../../../domain/providers/signature-package-provisioning.provider';

export type ListStoreSignaturePackageRequestsInput = {
  storeId: string;
};

@Injectable()
export class ListStoreSignaturePackageRequestsUseCase implements IUseCase<
  ListStoreSignaturePackageRequestsInput,
  SignaturePackageRequestDto[]
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly provisioning: SignaturePackageProvisioning,
  ) {}

  async execute(
    input: ListStoreSignaturePackageRequestsInput,
  ): Promise<SignaturePackageRequestDto[]> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError(
        ListStoreSignaturePackageRequestsUseCase.name,
        input.storeId,
      );
    }
    if (store.vertical !== 'Clínica') {
      throw new StoreVerticalNotSupportedError(
        ListStoreSignaturePackageRequestsUseCase.name,
        store.vertical,
        'pacotes de assinatura',
      );
    }
    return this.provisioning.listRequests(input.storeId);
  }
}
