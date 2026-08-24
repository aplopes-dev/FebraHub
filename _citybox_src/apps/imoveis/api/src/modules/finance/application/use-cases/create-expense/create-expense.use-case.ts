import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { isDateOnly } from '../../../../transactions/application/policies/transaction-date.policy';
import type { ExpenseEntity } from '../../../domain/entities/expense.entity';
import { ExpenseRepository } from '../../../domain/repositories/expense.repository.interface';

export type CreateExpenseInput = {
  storeId: string;
  label: string;
  amountCents: number;
  /** `YYYY-MM-DD`. */
  date: string;
  category?: string;
};

@Injectable()
export class CreateExpenseUseCase implements IUseCase<
  CreateExpenseInput,
  ExpenseEntity
> {
  constructor(private readonly expenses: ExpenseRepository) {}

  async execute(input: CreateExpenseInput): Promise<ExpenseEntity> {
    const label = input.label?.trim() ?? '';
    if (!label) {
      throw new ValidatorDomainError({
        internalMessage: 'label is required',
        externalMessage: 'Informe a descrição da despesa.',
        context: CreateExpenseUseCase.name,
      });
    }
    if (!Number.isFinite(input.amountCents) || input.amountCents < 0) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid amountCents: ${input.amountCents}`,
        externalMessage: 'O valor da despesa deve ser maior ou igual a zero.',
        context: CreateExpenseUseCase.name,
      });
    }
    if (!isDateOnly(input.date ?? '')) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid date: ${input.date}`,
        externalMessage: 'A data da despesa deve estar no formato AAAA-MM-DD.',
        context: CreateExpenseUseCase.name,
      });
    }

    return this.expenses.create({
      storeId: input.storeId,
      label,
      amountCents: Math.round(input.amountCents),
      date: input.date,
      category: input.category?.trim() ?? '',
    });
  }
}
