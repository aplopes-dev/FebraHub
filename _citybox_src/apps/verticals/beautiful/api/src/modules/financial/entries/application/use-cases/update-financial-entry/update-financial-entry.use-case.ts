import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntryNotEditableError } from '../../../domain/errors/financial-entry-not-editable.error';
import { parseIsoDateOnly } from '../../utils/financial-entry.utils';
import type { UpdateFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class UpdateFinancialEntryUseCase implements IUseCase<
  UpdateFinancialEntryDto,
  FinancialEntry
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(dto: UpdateFinancialEntryDto): Promise<FinancialEntry> {
    const loaded = await this.entryRepository.findById(
      dto.storeId,
      dto.entryId,
    );
    if (!loaded) {
      throw new FinancialEntryNotFoundError(
        UpdateFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    if (!loaded.entry.isManualPendingEditable()) {
      throw new FinancialEntryNotEditableError(
        UpdateFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    const updated = loaded.entry.withManualUpdate({
      description:
        dto.description !== undefined ? dto.description.trim() : undefined,
      valueCents: dto.valueCents,
      dueDate: dto.dueDate ? parseIsoDateOnly(dto.dueDate) : undefined,
      expenseCategoryId: dto.categoryId,
      incomeCategoryId: dto.incomeCategoryId,
      observation: dto.observation,
    });

    return this.entryRepository.save(updated);
  }
}
