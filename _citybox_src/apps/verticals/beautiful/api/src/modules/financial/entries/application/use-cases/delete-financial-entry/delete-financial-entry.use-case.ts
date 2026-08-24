import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import type { DeleteFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class DeleteFinancialEntryUseCase implements IUseCase<
  DeleteFinancialEntryDto,
  void
> {
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

    await this.entryRepository.delete(dto.storeId, dto.entryId);
  }
}
