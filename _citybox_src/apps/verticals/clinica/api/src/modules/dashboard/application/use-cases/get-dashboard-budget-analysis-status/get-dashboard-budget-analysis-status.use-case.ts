import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BudgetRepository } from '../../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import {
  buildBudgetAnalysisTimeline,
  resolveBudgetAnalysisPeriodRange,
  summarizeBudgetAnalysisStatus,
  toBudgetAnalysisRow,
} from '../../utils/dashboard-budget-analysis.math';
import type {
  DashboardBudgetPeriodMode,
  DashboardBudgetTimelinePoint,
  DashboardBudgetCountCents,
} from '../../utils/dashboard-budget-analysis.types';

export type GetDashboardBudgetAnalysisStatusDto = {
  storeId: string;
  periodMode: DashboardBudgetPeriodMode;
  year: number;
  month?: number;
  professionalId?: string;
};

export type GetDashboardBudgetAnalysisStatusResult = {
  summary: {
    open: DashboardBudgetCountCents;
    approved: DashboardBudgetCountCents;
    rejected: DashboardBudgetCountCents;
    totalCount: number;
    approvalRate: number;
  };
  timeline: DashboardBudgetTimelinePoint[];
  professionals: Array<{ id: string; name: string }>;
  years: number[];
};

@Injectable()
export class GetDashboardBudgetAnalysisStatusUseCase
  implements
    IUseCase<
      GetDashboardBudgetAnalysisStatusDto,
      GetDashboardBudgetAnalysisStatusResult
    >
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(
    dto: GetDashboardBudgetAnalysisStatusDto,
  ): Promise<GetDashboardBudgetAnalysisStatusResult> {
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

    const [rows, meta] = await Promise.all([
      this.budgetRepository.listBudgetsForAnalysisInRange(dto.storeId, {
        ...range,
        responsibleId: dto.professionalId,
      }),
      this.budgetRepository.listBudgetAnalysisMeta(dto.storeId),
    ]);

    const analysisRows = rows
      .map((row) =>
        toBudgetAnalysisRow(row.budget, row.items, row.patientName),
      )
      .filter((row): row is NonNullable<typeof row> => row != null);

    return {
      summary: summarizeBudgetAnalysisStatus(analysisRows),
      timeline: buildBudgetAnalysisTimeline({
        rows: analysisRows,
        periodMode: dto.periodMode,
        year: dto.year,
        month: dto.month,
      }),
      professionals: meta.professionals,
      years: meta.years,
    };
  }
}
