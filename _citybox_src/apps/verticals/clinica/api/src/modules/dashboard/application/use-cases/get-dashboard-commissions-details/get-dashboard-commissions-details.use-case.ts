import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CommissionPaymentRepository } from '../../../../commissions/payments/domain/repositories/commission-payment.repository.interface';
import {
  civilDayEndUtc,
  civilDayStartUtc,
} from '../../utils/dashboard-patients.dates';
import {
  filterCommissionRowsByProfessional,
  flattenCommissionPayments,
  paginateCommissionRows,
} from '../../utils/dashboard-commissions.math';
import type { DashboardCommissionPaidRow } from '../../utils/dashboard-commissions.types';

export type GetDashboardCommissionsDetailsDto = {
  storeId: string;
  startDate: string;
  endDate: string;
  professionalId?: string;
  page?: number;
  perPage?: number;
};

export type GetDashboardCommissionsDetailsResult = {
  items: DashboardCommissionPaidRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  totalNetCents: number;
};

@Injectable()
export class GetDashboardCommissionsDetailsUseCase implements IUseCase<
  GetDashboardCommissionsDetailsDto,
  GetDashboardCommissionsDetailsResult
> {
  constructor(
    private readonly commissionPaymentRepository: CommissionPaymentRepository,
  ) {}

  async execute(
    dto: GetDashboardCommissionsDetailsDto,
  ): Promise<GetDashboardCommissionsDetailsResult> {
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('startDate must be <= endDate');
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    const bundles =
      await this.commissionPaymentRepository.listPaymentsForDashboardInRange(
        dto.storeId,
        {
          startAt: civilDayStartUtc(dto.startDate),
          endAt: civilDayEndUtc(dto.endDate),
        },
      );

    const rows = filterCommissionRowsByProfessional(
      flattenCommissionPayments(bundles),
      dto.professionalId,
    );

    return paginateCommissionRows(rows, page, perPage);
  }
}
