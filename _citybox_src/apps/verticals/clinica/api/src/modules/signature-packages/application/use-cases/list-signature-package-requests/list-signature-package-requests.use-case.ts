import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  SignaturePackageRequest,
  type SignaturePackageRequestStatus,
} from '../../../domain/entities/signature-package-request.entity';
import { SignaturePackageRequestRepository } from '../../../domain/repositories/signature-package-request.repository.interface';

export type ListSignaturePackageRequestsInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  status?: SignaturePackageRequestStatus;
};

export type ListSignaturePackageRequestsOutput = {
  items: SignaturePackageRequest[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

@Injectable()
export class ListSignaturePackageRequestsUseCase
  implements
    IUseCase<
      ListSignaturePackageRequestsInput,
      ListSignaturePackageRequestsOutput
    >
{
  constructor(
    private readonly requestRepository: SignaturePackageRequestRepository,
  ) {}

  async execute(
    input: ListSignaturePackageRequestsInput,
  ): Promise<ListSignaturePackageRequestsOutput> {
    const page = input.page && input.page > 0 ? input.page : DEFAULT_PAGE;
    const perPage =
      input.perPage && input.perPage > 0 ? input.perPage : DEFAULT_PER_PAGE;

    const { items, total } = await this.requestRepository.findPageByStoreId(
      input.storeId,
      {
        page,
        perPage,
        status: input.status,
      },
    );

    const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);

    return {
      items,
      total,
      page,
      perPage,
      totalPages,
    };
  }
}
