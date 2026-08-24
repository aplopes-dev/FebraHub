import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { toIsoDateOnly } from '../../utils/financial-entry.utils';
import type {
  UpdateFinancialEntryRecurrenceDto,
  UpdateFinancialEntryRecurrenceResult,
} from '../../dtos/financial-entry.dto';

@Injectable()
export class UpdateFinancialEntryRecurrenceUseCase
  implements
    IUseCase<
      UpdateFinancialEntryRecurrenceDto,
      UpdateFinancialEntryRecurrenceResult
    >
{
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(
    dto: UpdateFinancialEntryRecurrenceDto,
  ): Promise<UpdateFinancialEntryRecurrenceResult> {
    const group = await this.entryRepository.findByRecurrenceGroup(
      dto.storeId,
      dto.groupId,
    );

    if (group.length === 0) {
      throw new FinancialEntryNotFoundError(
        UpdateFinancialEntryRecurrenceUseCase.name,
        dto.groupId,
      );
    }

    const anchorId = dto.entryId ?? group[0].id;
    const anchor = group.find((entry) => entry.id === anchorId);
    if (!anchor) {
      throw new FinancialEntryNotFoundError(
        UpdateFinancialEntryRecurrenceUseCase.name,
        anchorId,
      );
    }

    const anchorDue = toIsoDateOnly(anchor.dueDate);
    const affected = group.filter((entry) => {
      if (dto.scope === 'all') return true;
      if (dto.scope === 'this') return entry.id === anchor.id;
      return toIsoDateOnly(entry.dueDate) >= anchorDue;
    });

    const updated: FinancialEntry[] = [];
    for (const entry of affected) {
      const next = entry.withRecurrenceFields({
        description:
          dto.description !== undefined ? dto.description.trim() : undefined,
        valueCents: dto.valueCents,
      });
      updated.push(await this.entryRepository.save(next));
    }

    return { count: updated.length, entries: updated };
  }
}
