import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import {
  buildInadimplenciaReport,
  resolveInadimplenciaPeriodRange,
} from '../../utils/dashboard-inadimplencia.math';
import type {
  DashboardInadimplenciaPeriodMode,
  DashboardInadimplenciaReport,
} from '../../utils/dashboard-inadimplencia.types';

export type GetDashboardInadimplenciaDto = {
  storeId: string;
  periodMode: DashboardInadimplenciaPeriodMode;
  year: number;
  month?: number;
  now?: Date;
};

export type GetDashboardInadimplenciaResult = DashboardInadimplenciaReport & {
  years: number[];
};

@Injectable()
export class GetDashboardInadimplenciaUseCase implements IUseCase<
  GetDashboardInadimplenciaDto,
  GetDashboardInadimplenciaResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    dto: GetDashboardInadimplenciaDto,
  ): Promise<GetDashboardInadimplenciaResult> {
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

    const [debts, years] = await Promise.all([
      this.financialEntryRepository.listInadimplenciaDebtsInRange(dto.storeId, {
        startAt: range.startAt,
        endAt: range.endAt,
        todayKey,
      }),
      this.financialEntryRepository.listInadimplenciaYears(dto.storeId),
    ]);

    return {
      ...buildInadimplenciaReport(debts),
      years,
    };
  }
}
