import type { ExpenseEntity } from '../../../../domain/entities/expense.entity';
import { mapExpenseToHttp } from '../shared/expense-response.mapper';

export class CreateExpensePresenter {
  static toHttp(expense: ExpenseEntity) {
    return { data: mapExpenseToHttp(expense) };
  }
}
