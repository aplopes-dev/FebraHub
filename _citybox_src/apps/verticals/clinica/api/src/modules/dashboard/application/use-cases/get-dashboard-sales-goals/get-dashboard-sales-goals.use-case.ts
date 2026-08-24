import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { BudgetRepository } from '../../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import { DashboardSalesGoalRepository } from '../../../domain/repositories/dashboard-sales-goal.repository.interface';
import {
  aggregateApprovedBudgetDailySales,
  sumDailySalesCents,
  sumDailySalesOnDate,
  type DashboardDailySale,
} from '../../utils/dashboard-sales-goals.math';

export type GetDashboardSalesGoalsDto = {
  storeId: string;
  /** Optional clock for tests; defaults to now. */
  now?: Date;
};

export type GetDashboardSalesGoalsResult = {
  goalCents: number | null;
  /** Dia civil de início do acúmulo (yyyy-MM-dd); null sem meta ativa. */
  startDate: string | null;
  realizedCents: number;
  soldTodayCents: number;
  reached: boolean;
  dailySales: DashboardDailySale[];
};

@Injectable()
export class GetDashboardSalesGoalsUseCase
  implements IUseCase<GetDashboardSalesGoalsDto, GetDashboardSalesGoalsResult>
{
  constructor(
    private readonly salesGoalRepository: DashboardSalesGoalRepository,
    private readonly budgetRepository: BudgetRepository,
  ) {}

  async execute(
    dto: GetDashboardSalesGoalsDto,
  ): Promise<GetDashboardSalesGoalsResult> {
    const goal = await this.salesGoalRepository.findActive(dto.storeId);
    if (!goal) {
      return {
        goalCents: null,
        startDate: null,
        realizedCents: 0,
        soldTodayCents: 0,
        reached: false,
        dailySales: [],
      };
    }

    const now = dto.now ?? new Date();
    const todayIso = toIsoDateOnly(now);
    const endIsoDate = todayIso >= goal.startDate ? todayIso : goal.startDate;

    const approved = await this.budgetRepository.listApprovedBudgetsInRange(
      dto.storeId,
      { startIsoDate: goal.startDate, endIsoDate },
    );

    const dailySales = aggregateApprovedBudgetDailySales(
      approved,
      goal.startDate,
      endIsoDate,
    );
    const realizedCents = sumDailySalesCents(dailySales);
    const soldTodayCents = sumDailySalesOnDate(dailySales, todayIso);

    return {
      goalCents: goal.goalCents,
      startDate: goal.startDate,
      realizedCents,
      soldTodayCents,
      reached: realizedCents >= goal.goalCents,
      dailySales,
    };
  }
}
