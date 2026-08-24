import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  FinancialEntryStatus,
  FinancialEntryType,
} from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { splitCsv } from '../../utils/financial-entry.utils';
import type {
  ListFinancialEntriesDto,
  ListFinancialEntriesResult,
} from '../../dtos/financial-entry.dto';

@Injectable()
export class ListFinancialEntriesUseCase implements IUseCase<
  ListFinancialEntriesDto,
  ListFinancialEntriesResult
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(
    dto: ListFinancialEntriesDto,
  ): Promise<ListFinancialEntriesResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      startDate: dto.startDate,
      endDate: dto.endDate,
      dateField: dto.dateField,
      paidAtFrom: dto.paidAtFrom,
      paidAtTo: dto.paidAtTo,
      types: splitCsv(dto.types) as FinancialEntryType[] | undefined,
      statuses: splitCsv(dto.statuses) as FinancialEntryStatus[] | undefined,
      accountIds: splitCsv(dto.accountIds),
      paymentMethods: splitCsv(dto.paymentMethods),
      categoryIds: splitCsv(dto.categoryIds),
      clientId: dto.clientId,
      search: dto.search,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };

    const [items, total] = await Promise.all([
      this.entryRepository.findMany(dto.storeId, criteria),
      this.entryRepository.count(dto.storeId, criteria),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
