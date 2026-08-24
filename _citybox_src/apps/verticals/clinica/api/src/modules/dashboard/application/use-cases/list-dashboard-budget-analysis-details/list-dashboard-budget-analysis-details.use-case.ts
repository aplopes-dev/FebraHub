import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BudgetRepository } from '../../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import {
  filterBudgetAnalysisDetails,
  resolveBudgetAnalysisPeriodRange,
} from '../../utils/dashboard-budget-analysis.math';
import type {
  DashboardBudgetAnalysisDimension,
  DashboardBudgetAnalysisRow,
  DashboardBudgetPeriodMode,
  DashboardBudgetUiStatus,
} from '../../utils/dashboard-budget-analysis.types';

export type ListDashboardBudgetAnalysisDetailsDto = {
  storeId: string;
  status: DashboardBudgetUiStatus;
  periodMode: DashboardBudgetPeriodMode;
  year: number;
  month?: number;
  professionalId?: string;
  dimension?: DashboardBudgetAnalysisDimension;
  dimensionKey?: string;
  page?: number;
  perPage?: number;
  search?: string;
};

export type ListDashboardBudgetAnalysisDetailsResult = {
  items: DashboardBudgetAnalysisRow[];
  total: number;
  totalValueCents: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardBudgetAnalysisDetailsUseCase
  implements
    IUseCase<
      ListDashboardBudgetAnalysisDetailsDto,
      ListDashboardBudgetAnalysisDetailsResult
    >
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(
    dto: ListDashboardBudgetAnalysisDetailsDto,
  ): Promise<ListDashboardBudgetAnalysisDetailsResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    const range = resolveBudgetAnalysisPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const rows = await this.budgetRepository.listBudgetsForAnalysisInRange(
      dto.storeId,
      {
        ...range,
        responsibleId: dto.professionalId,
      },
    );

    const filtered = filterBudgetAnalysisDetails({
      rows,
      status: dto.status,
      dimension: dto.dimension,
      dimensionKey: dto.dimensionKey,
      search: dto.search,
    });

    const total = filtered.length;
    const totalValueCents = filtered.reduce(
      (sum, row) => sum + row.valueCents,
      0,
    );
    const items = filtered.slice((page - 1) * perPage, page * perPage);

    return {
      items,
      total,
      totalValueCents,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
