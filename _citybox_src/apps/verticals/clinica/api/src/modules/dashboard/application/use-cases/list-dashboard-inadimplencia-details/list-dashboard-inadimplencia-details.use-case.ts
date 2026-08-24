import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import {
  mapUnpaidInadimplenciaDetails,
  paginateInadimplenciaDetails,
  resolveInadimplenciaPeriodRange,
} from '../../utils/dashboard-inadimplencia.math';
import type {
  DashboardInadimplenciaDetailRow,
  DashboardInadimplenciaPeriodMode,
} from '../../utils/dashboard-inadimplencia.types';

export type ListDashboardInadimplenciaDetailsDto = {
  storeId: string;
  periodMode: DashboardInadimplenciaPeriodMode;
  year: number;
  month?: number;
  page?: number;
  perPage?: number;
  now?: Date;
};

export type ListDashboardInadimplenciaDetailsResult = {
  items: DashboardInadimplenciaDetailRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardInadimplenciaDetailsUseCase implements IUseCase<
  ListDashboardInadimplenciaDetailsDto,
  ListDashboardInadimplenciaDetailsResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    dto: ListDashboardInadimplenciaDetailsDto,
  ): Promise<ListDashboardInadimplenciaDetailsResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const now = dto.now ?? new Date();
    const todayKey = toIsoDateOnly(now);
    const range = resolveInadimplenciaPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const debts =
      await this.financialEntryRepository.listInadimplenciaDebtsInRange(
        dto.storeId,
        {
          startAt: range.startAt,
          endAt: range.endAt,
          todayKey,
        },
      );

    const unpaid = mapUnpaidInadimplenciaDetails(debts, todayKey);
    return paginateInadimplenciaDetails(
      unpaid,
      dto.page ?? 1,
      dto.perPage ?? 20,
    );
  }
}
