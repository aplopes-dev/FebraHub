import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';
import type {
  ListPaymentMethodsDto,
  ListPaymentMethodsResult,
} from '../../dtos/payment-method.dto';

@Injectable()
export class ListPaymentMethodsUseCase implements IUseCase<
  ListPaymentMethodsDto,
  ListPaymentMethodsResult
> {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(
    input: ListPaymentMethodsDto,
  ): Promise<ListPaymentMethodsResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, tabCounts] = await Promise.all([
      this.paymentMethodRepository.count(input.organizationId, criteria),
      this.paymentMethodRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.paymentMethodRepository.findAll(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts,
    };
  }
}
