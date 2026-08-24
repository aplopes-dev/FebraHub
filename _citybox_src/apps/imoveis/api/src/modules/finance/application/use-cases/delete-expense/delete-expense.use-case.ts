import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ExpenseNotFoundError } from '../../../domain/errors/expense-not-found.error';
import { ExpenseRepository } from '../../../domain/repositories/expense.repository.interface';

@Injectable()
export class DeleteExpenseUseCase implements IUseCase<
  { storeId: string; id: string },
  void
> {
  constructor(private readonly expenses: ExpenseRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<void> {
    const deleted = await this.expenses.delete(storeId, id);
    if (!deleted) throw new ExpenseNotFoundError(id);
  }
}
