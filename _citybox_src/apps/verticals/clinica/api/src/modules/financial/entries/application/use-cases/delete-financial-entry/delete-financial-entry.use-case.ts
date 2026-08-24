import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntryLinkedToCommissionError } from '../../../domain/errors/financial-entry-linked-to-commission.error';
import type { DeleteFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class DeleteFinancialEntryUseCase
  implements IUseCase<DeleteFinancialEntryDto, void>
{
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(dto: DeleteFinancialEntryDto): Promise<void> {
    const loaded = await this.entryRepository.findById(
      dto.storeId,
      dto.entryId,
    );
    if (!loaded) {
      throw new FinancialEntryNotFoundError(
        DeleteFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    if (await this.entryRepository.isLinkedToCommission(dto.storeId, dto.entryId)) {
      throw new FinancialEntryLinkedToCommissionError(
        DeleteFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    await this.entryRepository.delete(dto.storeId, dto.entryId);
  }
}
