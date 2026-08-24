import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import {
  buildPaymentMethodsSummary,
  resolvePaymentMethodAmountCents,
} from '../../utils/dashboard-payment-methods.math';
import type {
  DashboardPaymentMethodItem,
  DashboardPaymentMethodsSummary,
} from '../../utils/dashboard-payment-methods.types';

export type GetDashboardPaymentMethodsDto = {
  storeId: string;
  startDate: string;
  endDate: string;
};

export type GetDashboardPaymentMethodsResult = DashboardPaymentMethodsSummary;

@Injectable()
export class GetDashboardPaymentMethodsUseCase implements IUseCase<
  GetDashboardPaymentMethodsDto,
  GetDashboardPaymentMethodsResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    dto: GetDashboardPaymentMethodsDto,
  ): Promise<GetDashboardPaymentMethodsResult> {
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('startDate must be <= endDate');
    }

    const loaded =
      await this.financialEntryRepository.listReceivedIncomeInPaidAtRange(
        dto.storeId,
        dto.startDate,
        dto.endDate,
      );

    const rows = loaded.map(({ entry }) => ({
      paymentMethod: entry.paymentMethod,
      amountCents: resolvePaymentMethodAmountCents({
        valueCents: entry.valueCents,
        paidValueCents: entry.paidValueCents,
      }),
    }));

    return buildPaymentMethodsSummary(rows);
  }
}

export type { DashboardPaymentMethodItem };
