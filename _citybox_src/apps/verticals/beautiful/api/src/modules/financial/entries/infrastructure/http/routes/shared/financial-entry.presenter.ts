import type { FinancialEntryLoaded } from '../../../../domain/repositories/financial-entry.repository.interface';
import { toIsoDateOnly } from '../../../../application/utils/financial-entry.utils';
import type { FinancialEntry } from '../../../../domain/entities/financial-entry.entity';

export function toFinancialEntryResponse(
  loaded: FinancialEntryLoaded,
  today = new Date(),
) {
  const { entry } = loaded;
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    source: entry.source,
    description: entry.description,
    valueCents: entry.valueCents,
    dueDate: toIsoDateOnly(entry.dueDate),
    paidAt: entry.paidAt ? toIsoDateOnly(entry.paidAt) : null,
    paidValueCents: entry.paidValueCents,
    paymentMethod: entry.paymentMethod,
    paymentType: entry.paymentType,
    observation: entry.observation,
    accountId: entry.accountId,
    account: loaded.account,
    categoryId: entry.expenseCategoryId,
    category: loaded.expenseCategory,
    incomeCategoryId: entry.incomeCategoryId,
    incomeCategory: loaded.incomeCategory,
    clientId: entry.clientId,
    client: loaded.client,
    appointmentId: entry.appointmentId,
    installmentNumber: entry.installmentNumber,
    totalInstallments: entry.totalInstallments,
    recurrenceGroupId: entry.recurrenceGroupId,
    receiveDetail: entry.receiveDetail,
    isOverdue: entry.isOverdue(today),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export function toFinancialEntryResponseFromEntity(
  entry: FinancialEntry,
  today = new Date(),
) {
  return toFinancialEntryResponse(
    {
      entry,
      account: null,
      expenseCategory: null,
      incomeCategory: null,
      client: null,
    },
    today,
  );
}
