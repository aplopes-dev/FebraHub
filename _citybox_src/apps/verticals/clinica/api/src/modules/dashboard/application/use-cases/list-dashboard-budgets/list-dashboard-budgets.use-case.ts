import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BudgetRepository } from '../../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import { formatDateOnly } from '../../../../patients/application/mappers/patient-form.mapper';

export type ListDashboardBudgetsDto = {
  storeId: string;
  page?: number;
  perPage?: number;
};

export type DashboardBudgetItem = {
  id: string;
  patientId: string;
  patientName: string;
  description: string;
  budgetDate: string;
  status: 'open' | 'rejected';
  valueCents: number;
};

export type ListDashboardBudgetsResult = {
  items: DashboardBudgetItem[];
  total: number;
  totalValueCents: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardBudgetsUseCase
  implements IUseCase<ListDashboardBudgetsDto, ListDashboardBudgetsResult>
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(
    dto: ListDashboardBudgetsDto,
  ): Promise<ListDashboardBudgetsResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    const result = await this.budgetRepository.listOpenRejectedBudgets(
      dto.storeId,
      { skip: (page - 1) * perPage, take: perPage },
    );

    return {
      items: result.items.map((row) => ({
        id: row.id,
        patientId: row.patientId,
        patientName: row.patientName,
        description: row.description,
        budgetDate: formatDateOnly(row.date),
        status: row.status === 'pending' ? 'open' : 'rejected',
        valueCents: row.finalValueCents,
      })),
      total: result.total,
      totalValueCents: result.totalValueCents,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
