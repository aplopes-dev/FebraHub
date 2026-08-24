import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { BudgetRepository } from '../../../../patients/patient-budgets/domain/repositories/budget.repository.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';

export type GetDashboardSummaryDto = {
  storeId: string;
  /** Optional clock for tests; defaults to now. */
  now?: Date;
};

export type DashboardSummaryResult = {
  overdueIncomeTotalCents: number;
  openRejectedBudgetsTotalCents: number;
  upcomingBirthdaysCount: number;
};

@Injectable()
export class GetDashboardSummaryUseCase
  implements IUseCase<GetDashboardSummaryDto, DashboardSummaryResult>
{
  constructor(
    private readonly entryRepository: FinancialEntryRepository,
    private readonly budgetRepository: BudgetRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(dto: GetDashboardSummaryDto): Promise<DashboardSummaryResult> {
    const todayIsoDate = toIsoDateOnly(dto.now ?? new Date());
    const [
      overdueIncomeTotalCents,
      openRejectedBudgetsTotalCents,
      upcomingBirthdaysCount,
    ] = await Promise.all([
      this.entryRepository.sumOverdueIncomeCents(dto.storeId, todayIsoDate),
      this.budgetRepository.sumOpenRejectedBudgetsCents(dto.storeId),
      this.patientRepository.countUpcomingBirthdays(dto.storeId, todayIsoDate),
    ]);
    return {
      overdueIncomeTotalCents,
      openRejectedBudgetsTotalCents,
      upcomingBirthdaysCount,
    };
  }
}
