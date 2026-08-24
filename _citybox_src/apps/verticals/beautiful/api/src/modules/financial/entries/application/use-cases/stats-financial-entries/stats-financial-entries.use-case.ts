import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import type {
  StatsFinancialEntriesDto,
  StatsFinancialEntriesResult,
} from '../../dtos/financial-entry.dto';

@Injectable()
export class StatsFinancialEntriesUseCase implements IUseCase<
  StatsFinancialEntriesDto,
  StatsFinancialEntriesResult
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(
    dto: StatsFinancialEntriesDto,
  ): Promise<StatsFinancialEntriesResult> {
    const data = await this.entryRepository.computeStats(dto.storeId, {
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return { data };
  }
}
