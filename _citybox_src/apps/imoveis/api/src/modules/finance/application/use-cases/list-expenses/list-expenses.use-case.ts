import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { ExpenseEntity } from '../../../domain/entities/expense.entity';
import { ExpenseRepository } from '../../../domain/repositories/expense.repository.interface';

@Injectable()
export class ListExpensesUseCase implements IUseCase<
  { storeId: string },
  ExpenseEntity[]
> {
  constructor(private readonly expenses: ExpenseRepository) {}

  async execute({ storeId }: { storeId: string }): Promise<ExpenseEntity[]> {
    return this.expenses.findMany(storeId);
  }
}
