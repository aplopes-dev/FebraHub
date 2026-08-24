import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntryFrozenError } from '../../../domain/errors/financial-entry-frozen.error';
import {
  buildSettlementDetail,
  parseIsoDateOnly,
} from '../../utils/financial-entry.utils';
import type { SettleFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class PayFinancialEntryUseCase implements IUseCase<
  SettleFinancialEntryDto,
  FinancialEntry
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(dto: SettleFinancialEntryDto): Promise<FinancialEntry> {
    const loaded = await this.entryRepository.findById(
      dto.storeId,
      dto.entryId,
    );
    if (!loaded) {
      throw new FinancialEntryNotFoundError(
        PayFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    if (loaded.entry.type !== 'expense') {
      throw new FinancialEntryFrozenError(
        PayFinancialEntryUseCase.name,
        dto.entryId,
        'invalid_type',
      );
    }

    if (loaded.entry.status !== 'pending') {
      throw new FinancialEntryFrozenError(
        PayFinancialEntryUseCase.name,
        dto.entryId,
        loaded.entry.status === 'paid' ? 'paid' : 'cancelled',
      );
    }

    const receiveDetail = buildSettlementDetail({
      paymentMethod: dto.paymentMethod,
      accountId: dto.accountId,
      paidValueCents: dto.paidValueCents,
      paymentType: dto.paymentType,
      observation: dto.observation,
      checkIssueDate: dto.checkIssueDate,
      checkHolderName: dto.checkHolderName,
      checkNumber: dto.checkNumber,
      checkBank: dto.checkBank,
      checkDocument: dto.checkDocument,
    });

    const updated = loaded.entry.withPaid({
      paidAt: parseIsoDateOnly(dto.settledAt),
      paidValueCents: dto.paidValueCents,
      paymentMethod: dto.paymentMethod,
      accountId: dto.accountId,
      paymentType: dto.paymentType,
      observation: dto.observation,
      receiveDetail,
    });

    return this.entryRepository.save(updated);
  }
}
