import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BudgetRepository } from '../../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import {
  aggregateBudgetAnalysis,
  resolveBudgetAnalysisPeriodRange,
} from '../../utils/dashboard-budget-analysis.math';
import type {
  DashboardBudgetAnalysisAggregate,
  DashboardBudgetAnalysisDimension,
  DashboardBudgetPeriodMode,
  DashboardBudgetUiStatus,
} from '../../utils/dashboard-budget-analysis.types';

export type GetDashboardBudgetAnalysisDto = {
  storeId: string;
  status: DashboardBudgetUiStatus;
  dimension: DashboardBudgetAnalysisDimension;
  periodMode: DashboardBudgetPeriodMode;
  year: number;
  month?: number;
  professionalId?: string;
};

export type GetDashboardBudgetAnalysisResult = {
  items: DashboardBudgetAnalysisAggregate[];
};

@Injectable()
export class GetDashboardBudgetAnalysisUseCase
  implements
    IUseCase<GetDashboardBudgetAnalysisDto, GetDashboardBudgetAnalysisResult>
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(
    dto: GetDashboardBudgetAnalysisDto,
  ): Promise<GetDashboardBudgetAnalysisResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

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

    return {
      items: aggregateBudgetAnalysis({
        rows,
        status: dto.status,
        dimension: dto.dimension,
      }),
    };
  }
}
