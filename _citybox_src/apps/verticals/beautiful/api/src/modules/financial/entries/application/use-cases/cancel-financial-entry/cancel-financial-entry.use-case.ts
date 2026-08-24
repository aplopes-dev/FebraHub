import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntryFrozenError } from '../../../domain/errors/financial-entry-frozen.error';
import type { CancelFinancialEntryDto } from '../../dtos/financial-entry.dto';

/**
 * Cancela pagamento/recebimento: desfaz a liquidação e volta o lançamento a
 * `pending` (a UI mostra “vencido” se `dueDate` já passou).
 */
@Injectable()
export class CancelFinancialEntryUseCase implements IUseCase<
  CancelFinancialEntryDto,
  FinancialEntry
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(dto: CancelFinancialEntryDto): Promise<FinancialEntry> {
    const loaded = await this.entryRepository.findById(
      dto.storeId,
      dto.entryId,
    );
    if (!loaded) {
      throw new FinancialEntryNotFoundError(
        CancelFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    const { status } = loaded.entry;

    if (status === 'cancelled' || status === 'pending') {
      throw new FinancialEntryFrozenError(
        CancelFinancialEntryUseCase.name,
        dto.entryId,
        status,
      );
    }

    return this.entryRepository.save(loaded.entry.withUnsettled());
  }
}
