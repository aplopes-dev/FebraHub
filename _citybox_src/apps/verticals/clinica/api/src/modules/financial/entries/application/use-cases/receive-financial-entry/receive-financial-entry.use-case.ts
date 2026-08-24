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
import { AccrueCommissionsOnDebitReceivedService } from '../../../../../commissions/accruals/application/services/accrue-commissions-on-debit-received.service';

@Injectable()
export class ReceiveFinancialEntryUseCase
  implements IUseCase<SettleFinancialEntryDto, FinancialEntry>
{
  constructor(
    private readonly entryRepository: FinancialEntryRepository,
    private readonly accrueCommissionsOnDebitReceived: AccrueCommissionsOnDebitReceivedService,
  ) {}

  async execute(dto: SettleFinancialEntryDto): Promise<FinancialEntry> {
    const loaded = await this.entryRepository.findById(
      dto.storeId,
      dto.entryId,
    );
    if (!loaded) {
      throw new FinancialEntryNotFoundError(
        ReceiveFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    if (loaded.entry.type !== 'income') {
      throw new FinancialEntryFrozenError(
        ReceiveFinancialEntryUseCase.name,
        dto.entryId,
        'invalid_type',
      );
    }

    if (loaded.entry.status !== 'pending') {
      throw new FinancialEntryFrozenError(
        ReceiveFinancialEntryUseCase.name,
        dto.entryId,
        loaded.entry.status === 'received' ? 'received' : 'cancelled',
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

    const paidAt = parseIsoDateOnly(dto.settledAt);
    const updated = loaded.entry.withReceived({
      paidAt,
      paidValueCents: dto.paidValueCents,
      paymentMethod: dto.paymentMethod,
      accountId: dto.accountId,
      paymentType: dto.paymentType,
      observation: dto.observation,
      receiveDetail,
    });

    const saved = await this.entryRepository.save(updated);

    await this.accrueCommissionsOnDebitReceived.execute({
      storeId: saved.storeId,
      financialEntryId: saved.id,
      source: saved.source,
      patientId: saved.patientId,
      budgetId: saved.budgetId,
      description: saved.description,
      valueCents: saved.valueCents,
      paidValueCents: saved.paidValueCents ?? dto.paidValueCents,
      paidAt: saved.paidAt ?? paidAt,
      installmentIndex: saved.installmentIndex,
      installmentNumber: saved.installmentNumber,
      totalInstallments: saved.totalInstallments,
      debitDetail: saved.debitDetail,
    });

    return saved;
  }
}
