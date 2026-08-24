import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import type { RestoreFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class RestoreFinancialEntryUseCase implements IUseCase<
  RestoreFinancialEntryDto,
  FinancialEntry
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(input: RestoreFinancialEntryDto): Promise<FinancialEntry> {
    const entry = await this.financialEntryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!entry) throw new FinancialEntryNotFoundError(input.id);

    // Restaurar quem já está ativo não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — lançamento ativo — é o mesmo.
    if (!entry.deletedAt) return entry;

    const restored = entry.restore();
    await this.financialEntryRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );
    return restored;
  }
}
