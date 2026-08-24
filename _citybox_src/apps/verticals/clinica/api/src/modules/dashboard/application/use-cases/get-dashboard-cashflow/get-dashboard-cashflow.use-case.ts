import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import {
  buildCashflowReport,
  resolveCashflowPeriodRange,
} from '../../utils/dashboard-cashflow.math';
import type {
  DashboardCashflowPeriodMode,
  DashboardCashflowTimelinePoint,
  DashboardCashflowTotals,
} from '../../utils/dashboard-cashflow.types';

export type GetDashboardCashflowDto = {
  storeId: string;
  periodMode: DashboardCashflowPeriodMode;
  year: number;
  month?: number;
  now?: Date;
};

export type GetDashboardCashflowResult = {
  totals: DashboardCashflowTotals;
  timeline: DashboardCashflowTimelinePoint[];
  years: number[];
};

@Injectable()
export class GetDashboardCashflowUseCase implements IUseCase<
  GetDashboardCashflowDto,
  GetDashboardCashflowResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    dto: GetDashboardCashflowDto,
  ): Promise<GetDashboardCashflowResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const range = resolveCashflowPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const now = dto.now ?? new Date();
    const todayKey = toIsoDateOnly(now);

    const [rows, years] = await Promise.all([
      this.financialEntryRepository.listEntriesForCashflowInRange(dto.storeId, {
        startAt: range.startAt,
        endAt: range.endAt,
      }),
      this.financialEntryRepository.listCashflowYears(dto.storeId),
    ]);

    const report = buildCashflowReport({
      rows,
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
      todayKey,
    });

    return {
      totals: report.totals,
      timeline: report.timeline,
      years,
    };
  }
}
