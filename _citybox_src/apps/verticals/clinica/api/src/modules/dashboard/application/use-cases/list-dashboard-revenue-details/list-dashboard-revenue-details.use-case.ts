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
  filterLinesByDimension,
  matchesPatientSearch,
  toDetailRows,
} from '../../utils/dashboard-revenue.math';
import type {
  DashboardRevenueDetailRow,
  DashboardRevenueDimension,
  DashboardRevenueMode,
} from '../../utils/dashboard-revenue.types';

export type ListDashboardRevenueDetailsDto = {
  storeId: string;
  mode?: DashboardRevenueMode;
  dimension?: DashboardRevenueDimension;
  dimensionKey: string;
  period?: BirthdayPeriod;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
  search?: string;
  now?: Date;
};

export type ListDashboardRevenueDetailsResult = {
  items: DashboardRevenueDetailRow[];
  total: number;
  totalValueCents: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardRevenueDetailsUseCase
  implements
    IUseCase<ListDashboardRevenueDetailsDto, ListDashboardRevenueDetailsResult>
{
  constructor(private readonly revenueBuilder: DashboardRevenueBuilder) {}

  async execute(
    dto: ListDashboardRevenueDetailsDto,
  ): Promise<ListDashboardRevenueDetailsResult> {
    if (!dto.dimensionKey?.trim()) {
      throw new BadRequestException('dimensionKey é obrigatório.');
    }

    const mode = dto.mode ?? 'receipts';
    const dimension = dto.dimension ?? 'professionals';
    const period = dto.period ?? 'today';
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const todayIsoDate = toIsoDateOnly(dto.now ?? new Date());

    if (period === 'custom') {
      if (!dto.startDate?.trim() || !dto.endDate?.trim()) {
        throw new BadRequestException(
          'startDate e endDate são obrigatórios para período custom.',
        );
      }
      if (parseIsoDateOnly(dto.endDate) < parseIsoDateOnly(dto.startDate)) {
        throw new BadRequestException(
          'endDate deve ser maior ou igual a startDate.',
        );
      }
    }

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

    const filtered = filterLinesByDimension(
      lines,
      dimension,
      dto.dimensionKey,
    ).filter((line) => matchesPatientSearch(line, dto.search));

    const details = toDetailRows(filtered);
    const total = details.length;
    const totalValueCents = details.reduce(
      (sum, row) => sum + row.valueCents,
      0,
    );
    const skip = (page - 1) * perPage;

    return {
      items: details.slice(skip, skip + perPage),
      total,
      totalValueCents,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
