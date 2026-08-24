import type { ExpenseEntity } from '../../../../domain/entities/expense.entity';

/** Shape HTTP de uma despesa (`ExpenseEntry` no web). */
export function mapExpenseToHttp(expense: ExpenseEntity) {
  return {
    id: expense.id,
    label: expense.label,
    amountCents: expense.amountCents,
    date: expense.date,
    category: expense.category,
  };
}
