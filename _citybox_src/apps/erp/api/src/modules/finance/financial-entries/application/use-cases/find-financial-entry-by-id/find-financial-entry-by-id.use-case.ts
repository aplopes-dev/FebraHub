import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import type { FindFinancialEntryByIdDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class FindFinancialEntryByIdUseCase implements IUseCase<
  FindFinancialEntryByIdDto,
  FinancialEntry
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(input: FindFinancialEntryByIdDto): Promise<FinancialEntry> {
    const entry = await this.financialEntryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!entry) throw new FinancialEntryNotFoundError(input.id);

    return entry;
  }
}
