import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import {
  buildSettlementDetail,
  newRecurrenceGroupId,
  parseIsoDateOnly,
  shiftDueDate,
} from '../../utils/financial-entry.utils';
import type { CreateFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class CreateFinancialEntryUseCase implements IUseCase<
  CreateFinancialEntryDto,
  FinancialEntry[]
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(dto: CreateFinancialEntryDto): Promise<FinancialEntry[]> {
    const times = dto.isRecurring ? Math.max(1, dto.recurrenceTimes ?? 1) : 1;
    const recurrenceType = dto.recurrenceType ?? 'monthly';
    const groupId = times > 1 ? newRecurrenceGroupId() : null;
    const baseDueDate = parseIsoDateOnly(dto.dueDate);
    const isSettled = dto.isPaid === true;
    const settledStatus =
      dto.type === 'income' ? ('received' as const) : ('paid' as const);
    const paidAt =
      isSettled && dto.paymentDate
        ? parseIsoDateOnly(dto.paymentDate)
        : isSettled
          ? baseDueDate
          : null;
    const paidValueCents = isSettled
      ? (dto.paidValueCents ?? dto.valueCents)
      : null;
    const receiveDetail =
      isSettled && dto.paymentMethod && dto.accountId
        ? buildSettlementDetail({
            paymentMethod: dto.paymentMethod,
            accountId: dto.accountId,
            paidValueCents: paidValueCents ?? dto.valueCents,
          })
        : null;

    const entries: FinancialEntry[] = [];
    for (let i = 0; i < times; i += 1) {
      const dueDate =
        i === 0 ? baseDueDate : shiftDueDate(baseDueDate, recurrenceType, i);
      const settledThis = isSettled && i === 0;
      entries.push(
        FinancialEntry.create({
          storeId: dto.storeId,
          type: dto.type,
          source: 'manual',
          description: dto.description.trim(),
          valueCents: dto.valueCents,
          dueDate,
          status: settledThis ? settledStatus : 'pending',
          paidAt: settledThis ? paidAt : null,
          paidValueCents: settledThis ? paidValueCents : null,
          paymentMethod: settledThis ? (dto.paymentMethod ?? null) : null,
          accountId: settledThis ? (dto.accountId ?? null) : null,
          receiveDetail: settledThis ? receiveDetail : null,
          expenseCategoryId:
            dto.type === 'expense' ? (dto.categoryId ?? null) : null,
          incomeCategoryId:
            dto.type === 'income'
              ? (dto.incomeCategoryId ?? dto.categoryId ?? null)
              : null,
          clientId: dto.clientId ?? null,
          appointmentId: dto.appointmentId ?? null,
          observation: dto.observation?.trim() ?? null,
          installmentNumber: groupId ? i + 1 : null,
          totalInstallments: groupId ? times : null,
          recurrenceGroupId: groupId,
        }),
      );
    }

    return this.entryRepository.saveMany(entries);
  }
}
