import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialEntryType } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { splitCsv } from '../../utils/financial-entry.utils';
import type {
  EntriesByPaymentMethodDto,
  EntriesByPaymentMethodResult,
} from '../../dtos/financial-entry.dto';

@Injectable()
export class EntriesByPaymentMethodUseCase implements IUseCase<
  EntriesByPaymentMethodDto,
  EntriesByPaymentMethodResult
> {
  constructor(private readonly entryRepository: FinancialEntryRepository) {}

  async execute(
    dto: EntriesByPaymentMethodDto,
  ): Promise<EntriesByPaymentMethodResult> {
    const data = await this.entryRepository.aggregateByPaymentMethod(
      dto.storeId,
      {
        startDate: dto.startDate,
        endDate: dto.endDate,
        dateField: dto.dateField,
        paidAtFrom: dto.paidAtFrom,
        paidAtTo: dto.paidAtTo,
        types: splitCsv(dto.types) as FinancialEntryType[] | undefined,
        accountIds: splitCsv(dto.accountIds),
        paymentMethods: splitCsv(dto.paymentMethods),
      },
    );

    return { data };
  }
}
