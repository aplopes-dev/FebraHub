import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CommissionPaymentRepository } from '../../../../commissions/payments/domain/repositories/commission-payment.repository.interface';
import {
  buildCommissionsSummary,
  flattenCommissionPayments,
  resolveCommissionsPeriodRange,
} from '../../utils/dashboard-commissions.math';
import type {
  DashboardCommissionBreakdownItem,
  DashboardCommissionProfessionalRank,
  DashboardCommissionsPeriodMode,
} from '../../utils/dashboard-commissions.types';

export type GetDashboardCommissionsDto = {
  storeId: string;
  periodMode: DashboardCommissionsPeriodMode;
  year: number;
  month?: number;
};

export type GetDashboardCommissionsResult = {
  netTotalCents: number;
  byTrigger: DashboardCommissionBreakdownItem[];
  byType: DashboardCommissionBreakdownItem[];
  ranking: DashboardCommissionProfessionalRank[];
  years: number[];
};

@Injectable()
export class GetDashboardCommissionsUseCase implements IUseCase<
  GetDashboardCommissionsDto,
  GetDashboardCommissionsResult
> {
  constructor(
    private readonly commissionPaymentRepository: CommissionPaymentRepository,
  ) {}

  async execute(
    dto: GetDashboardCommissionsDto,
  ): Promise<GetDashboardCommissionsResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const range = resolveCommissionsPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const [bundles, years] = await Promise.all([
      this.commissionPaymentRepository.listPaymentsForDashboardInRange(
        dto.storeId,
        { startAt: range.startAt, endAt: range.endAt },
      ),
      this.commissionPaymentRepository.listCommissionPaymentYears(dto.storeId),
    ]);

    const rows = flattenCommissionPayments(bundles);
    const summary = buildCommissionsSummary(rows);

    return {
      ...summary,
      years,
    };
  }
}
