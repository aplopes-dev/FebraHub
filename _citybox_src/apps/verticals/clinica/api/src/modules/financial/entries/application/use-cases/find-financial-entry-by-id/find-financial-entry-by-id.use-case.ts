import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import type { FinancialEntryLoaded } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import type { FindFinancialEntryByIdDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class FindFinancialEntryByIdUseCase
  implements IUseCase<FindFinancialEntryByIdDto, FinancialEntryLoaded>
{
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(
    dto: FindFinancialEntryByIdDto,
  ): Promise<FinancialEntryLoaded> {
    const loaded = await this.entryRepository.findById(
      dto.storeId,
      dto.entryId,
    );
    if (!loaded) {
      throw new FinancialEntryNotFoundError(
        FindFinancialEntryByIdUseCase.name,
        dto.entryId,
      );
    }
    return loaded;
  }
}
