import type {
  RentalPayoutStatus,
  SplitSource,
  TransactionStatus,
  TransactionType,
} from '../../../domain/entities/transaction.entity';

export const TRANSACTION_TYPES: readonly TransactionType[] = ['SALE', 'RENTAL'];

export const TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  'DRAFT',
  'PROPOSAL',
  'CONTRACT_SIGNED',
  'COMPLETED',
  'CANCELLED',
];

export const SPLIT_SOURCES: readonly SplitSource[] = [
  'GLOBAL',
  'AGENT_OVERRIDE',
  'MANUAL',
];

export const RENTAL_PAYOUT_STATUSES: readonly RentalPayoutStatus[] = [
  'AWAITING_PAYMENT',
  'PAID_BY_TENANT',
  'READY_FOR_PAYOUT',
  'PAID_TO_LANDLORD',
];

function parseAll<T extends string>(
  values: string[] | undefined,
  allowed: readonly T[],
  label: string,
): T[] | undefined {
  if (!values?.length) return undefined;
  return values.map((value) => {
    if (!allowed.includes(value as T)) {
      throw new Error(`Invalid ${label}: ${value}`);
    }
    return value as T;
  });
}

export function parseTransactionTypes(
  values?: string[],
): TransactionType[] | undefined {
  return parseAll(values, TRANSACTION_TYPES, 'transaction type');
}

export function parseTransactionStatuses(
  values?: string[],
): TransactionStatus[] | undefined {
  return parseAll(values, TRANSACTION_STATUSES, 'transaction status');
}
