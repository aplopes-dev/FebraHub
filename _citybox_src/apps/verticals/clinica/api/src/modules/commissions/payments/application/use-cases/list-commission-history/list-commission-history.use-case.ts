import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CommissionPaymentRepository } from '../../../domain/repositories/commission-payment.repository.interface';
import { parseMemberId } from '../../../../shared/domain/commission-member.utils';
import type { CommissionMemberSummaryView } from '../../../../accruals/application/mappers/aggregate-open-commissions';
import { EnrichCommissionTreatmentNamesService } from '../../../../accruals/application/services/enrich-commission-treatment-names.service';
import { aggregateHistoryByMember } from '../../mappers/aggregate-history-by-member';
import type { ListCommissionHistoryDto } from '../../dtos/commission-payment.dto';

export type ListCommissionHistoryResult = {
  items: CommissionMemberSummaryView[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListCommissionHistoryUseCase
  implements IUseCase<ListCommissionHistoryDto, ListCommissionHistoryResult>
{
  constructor(
    private readonly paymentRepository: CommissionPaymentRepository,
    private readonly enrichTreatmentNames: EnrichCommissionTreatmentNamesService,
  ) {}

  async execute(
    dto: ListCommissionHistoryDto,
  ): Promise<ListCommissionHistoryResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const memberId = dto.memberId
      ? parseMemberId(dto.memberId)
      : undefined;

    const criteria = {
      startDate: dto.startDate,
      endDate: dto.endDate,
      memberId,
      search: dto.search?.trim() || undefined,
    };

    const loaded = await this.paymentRepository.findMany(dto.storeId, {
      ...criteria,
      skip: 0,
      take: 10_000,
    });

    const allAccruals = loaded.flatMap((row) => row.accruals);
    const enriched = await this.enrichTreatmentNames.execute(
      dto.storeId,
      allAccruals,
    );
    const byId = new Map(enriched.map((accrual) => [accrual.id, accrual]));

    const summaries = aggregateHistoryByMember(
      loaded.map(({ payment, accruals }) => ({
        payment,
        accruals: accruals.map((accrual) => byId.get(accrual.id) ?? accrual),
      })),
    );
    const total = summaries.length;
    const skip = (page - 1) * perPage;
    const items = summaries.slice(skip, skip + perPage);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
