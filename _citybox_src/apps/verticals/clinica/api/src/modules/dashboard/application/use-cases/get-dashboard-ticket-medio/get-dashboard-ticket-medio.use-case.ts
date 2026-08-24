import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import {
  buildTicketMedioReport,
  resolveTicketMedioQueryWindow,
} from '../../utils/dashboard-ticket-medio.math';
import type {
  DashboardTicketMedioPeriodMode,
  DashboardTicketMedioReport,
} from '../../utils/dashboard-ticket-medio.types';

export type GetDashboardTicketMedioDto = {
  storeId: string;
  periodMode: DashboardTicketMedioPeriodMode;
  year: number;
  month?: number;
  now?: Date;
};

export type GetDashboardTicketMedioResult = DashboardTicketMedioReport & {
  years: number[];
};

@Injectable()
export class GetDashboardTicketMedioUseCase implements IUseCase<
  GetDashboardTicketMedioDto,
  GetDashboardTicketMedioResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    dto: GetDashboardTicketMedioDto,
  ): Promise<GetDashboardTicketMedioResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const now = dto.now ?? new Date();
    const todayKey = toIsoDateOnly(now);
    const window = resolveTicketMedioQueryWindow({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const [dayMetrics, years] = await Promise.all([
      this.financialEntryRepository.listTicketMedioDayMetricsInRange(
        dto.storeId,
        {
          startAt: window.startAt,
          endAt: window.endAt,
          todayKey,
        },
      ),
      this.financialEntryRepository.listTicketMedioYears(dto.storeId),
    ]);

    const report = buildTicketMedioReport({
      dayMetrics,
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    return {
      ...report,
      years,
    };
  }
}
