import { randomUUID } from 'crypto';
import type { FinancialEntryReceiveDetail } from '../../domain/entities/financial-entry.entity';

export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function shiftDueDate(
  base: Date,
  recurrenceType: RecurrenceType,
  times: number,
): Date {
  const result = new Date(base);
  switch (recurrenceType) {
    case 'daily':
      result.setUTCDate(result.getUTCDate() + times);
      break;
    case 'weekly':
      result.setUTCDate(result.getUTCDate() + times * 7);
      break;
    case 'quarterly':
      result.setUTCMonth(result.getUTCMonth() + times * 3);
      break;
    case 'yearly':
      result.setUTCFullYear(result.getUTCFullYear() + times);
      break;
    case 'monthly':
    default:
      result.setUTCMonth(result.getUTCMonth() + times);
      break;
  }
  return result;
}

export function newRecurrenceGroupId(): string {
  return randomUUID();
}

export function buildSettlementDetail(input: {
  paymentMethod: string;
  accountId: string;
  paidValueCents: number;
  paymentType?: string;
  observation?: string;
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
}): FinancialEntryReceiveDetail {
  return {
    paymentMethod: input.paymentMethod,
    accountId: input.accountId,
    paidValueCents: input.paidValueCents,
    ...(input.paymentType ? { paymentType: input.paymentType } : {}),
    ...(input.observation ? { observation: input.observation } : {}),
    ...(input.checkIssueDate
      ? { checkIssueDate: input.checkIssueDate.slice(0, 10) }
      : {}),
    ...(input.checkHolderName
      ? { checkHolderName: input.checkHolderName }
      : {}),
    ...(input.checkNumber ? { checkNumber: input.checkNumber } : {}),
    ...(input.checkBank ? { checkBank: input.checkBank } : {}),
    ...(input.checkDocument ? { checkDocument: input.checkDocument } : {}),
  };
}

export function splitCsv(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}
