import type { ExpenseEntity } from '../entities/expense.entity';

export type ExpenseWritePayload = {
  storeId: string;
  label: string;
  amountCents: number;
  /** date-only (`YYYY-MM-DD`). */
  date: string;
  category: string;
};

export abstract class ExpenseRepository {
  abstract findMany(storeId: string): Promise<ExpenseEntity[]>;

  abstract create(payload: ExpenseWritePayload): Promise<ExpenseEntity>;

  abstract delete(storeId: string, id: string): Promise<boolean>;
}
