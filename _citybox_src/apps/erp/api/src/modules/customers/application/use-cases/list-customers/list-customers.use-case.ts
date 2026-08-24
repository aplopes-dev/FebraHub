import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import {
  CUSTOMER_STAGES,
  type CustomerStageValue,
} from '../../../domain/entities/customer.entity';
import { CustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import type {
  CustomerTabCounts,
  ListCustomersDto,
  ListCustomersResult,
} from '../../dtos/customer.dto';

@Injectable()
export class ListCustomersUseCase implements IUseCase<
  ListCustomersDto,
  ListCustomersResult
> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(input: ListCustomersDto): Promise<ListCustomersResult> {
    const tab = input.tab ?? 'all';
    const criteria = { search: input.search, tab };

    const [total, byStage] = await Promise.all([
      this.customerRepository.count(input.organizationId, criteria),
      this.customerRepository.countByStage(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);
    const items = await this.customerRepository.findAll(input.organizationId, {
      ...criteria,
      skip: pagination.skip,
      take: pagination.perPage,
    });

    const all = CUSTOMER_STAGES.reduce(
      (sum, stage) => sum + (byStage[stage] ?? 0),
      0,
    );

    const tabCounts: CustomerTabCounts = {
      all,
      ...Object.fromEntries(
        CUSTOMER_STAGES.map((stage: CustomerStageValue) => [
          stage,
          byStage[stage] ?? 0,
        ]),
      ),
    } as CustomerTabCounts;

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
