import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import {
  parseIsoDateOnly,
  resolveBirthdayPeriodRange,
  type BirthdayPeriod,
} from '../../../../patients/domain/utils/birthday-window.utils';
import { DashboardRevenueBuilder } from '../../utils/dashboard-revenue.builder';
import {
  aggregateRevenueLines,
  mergeZeroRevenueBuckets,
} from '../../utils/dashboard-revenue.math';
import type {
  DashboardRevenueAggregateRow,
  DashboardRevenueDimension,
  DashboardRevenueMode,
} from '../../utils/dashboard-revenue.types';

export type GetDashboardRevenueAnalysisDto = {
  storeId: string;
  mode?: DashboardRevenueMode;
  dimension?: DashboardRevenueDimension;
  period?: BirthdayPeriod;
  startDate?: string;
  endDate?: string;
  includeWithoutRevenue?: boolean;
  now?: Date;
};

export type GetDashboardRevenueAnalysisResult = {
  items: DashboardRevenueAggregateRow[];
};

@Injectable()
export class GetDashboardRevenueAnalysisUseCase
  implements
    IUseCase<GetDashboardRevenueAnalysisDto, GetDashboardRevenueAnalysisResult>
{
  constructor(private readonly revenueBuilder: DashboardRevenueBuilder) {}

  async execute(
    dto: GetDashboardRevenueAnalysisDto,
  ): Promise<GetDashboardRevenueAnalysisResult> {
    const mode = dto.mode ?? 'receipts';
    const dimension = dto.dimension ?? 'professionals';
    const period = dto.period ?? 'today';
    const todayIsoDate = toIsoDateOnly(dto.now ?? new Date());

    this.assertCustomPeriod(period, dto.startDate, dto.endDate);

    const range = resolveBirthdayPeriodRange(
      period,
      todayIsoDate,
      dto.startDate,
      dto.endDate,
    );

    const lines =
      mode === 'receipts'
        ? await this.revenueBuilder.buildReceiptLines(
            dto.storeId,
            range.startIsoDate,
            range.endIsoDate,
          )
        : await this.revenueBuilder.buildSaleLines(
            dto.storeId,
            range.startIsoDate,
            range.endIsoDate,
          );

    let items = aggregateRevenueLines(lines, dimension);

    if (
      dto.includeWithoutRevenue &&
      mode === 'receipts' &&
      (dimension === 'treatments' || dimension === 'specialties')
    ) {
      const saleLines = await this.revenueBuilder.buildSaleLines(
        dto.storeId,
        range.startIsoDate,
        range.endIsoDate,
      );
      items = mergeZeroRevenueBuckets(items, saleLines, dimension);
    }

    return { items };
  }

  private assertCustomPeriod(
    period: BirthdayPeriod,
    startDate?: string,
    endDate?: string,
  ): void {
    if (period !== 'custom') return;
    if (!startDate?.trim() || !endDate?.trim()) {
      throw new BadRequestException(
        'startDate e endDate são obrigatórios para período custom.',
      );
    }
    if (parseIsoDateOnly(endDate) < parseIsoDateOnly(startDate)) {
      throw new BadRequestException(
        'endDate deve ser maior ou igual a startDate.',
      );
    }
  }
}
