import type { ExpenseEntity } from '../../../../domain/entities/expense.entity';
import { mapExpenseToHttp } from '../shared/expense-response.mapper';

export class ListExpensesPresenter {
  static toHttp(expenses: ExpenseEntity[]) {
    return { data: expenses.map(mapExpenseToHttp) };
  }
}
