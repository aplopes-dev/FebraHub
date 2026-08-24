import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CommissionPaymentRepository } from '../../../domain/repositories/commission-payment.repository.interface';
import { CommissionPaymentNotFoundError } from '../../../domain/errors/commission-payment-not-found.error';
import { parseMemberId } from '../../../../shared/domain/commission-member.utils';
import type { CommissionMemberSummaryView } from '../../../../accruals/application/mappers/aggregate-open-commissions';
import { EnrichCommissionTreatmentNamesService } from '../../../../accruals/application/services/enrich-commission-treatment-names.service';
import { aggregateHistoryByMember } from '../../mappers/aggregate-history-by-member';
import type { GetCommissionPaymentDetailDto } from '../../dtos/commission-payment.dto';

@Injectable()
export class GetCommissionPaymentDetailUseCase
  implements
    IUseCase<GetCommissionPaymentDetailDto, CommissionMemberSummaryView>
{
  constructor(
    private readonly paymentRepository: CommissionPaymentRepository,
    private readonly enrichTreatmentNames: EnrichCommissionTreatmentNamesService,
  ) {}

  async execute(
    dto: GetCommissionPaymentDetailDto,
  ): Promise<CommissionMemberSummaryView> {
    const memberId = parseMemberId(dto.memberId);
    const loaded = await this.paymentRepository.findMany(dto.storeId, {
      memberId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      skip: 0,
      take: 10_000,
    });

    const allAccruals = loaded.flatMap((row) => row.accruals);
    const enriched = await this.enrichTreatmentNames.execute(
      dto.storeId,
      allAccruals,
    );
    const byId = new Map(enriched.map((accrual) => [accrual.id, accrual]));

    const [summary] = aggregateHistoryByMember(
      loaded.map(({ payment, accruals }) => ({
        payment,
        accruals: accruals.map((accrual) => byId.get(accrual.id) ?? accrual),
      })),
    );
    if (!summary) {
      throw new CommissionPaymentNotFoundError(
        GetCommissionPaymentDetailUseCase.name,
        memberId,
      );
    }

    return summary;
  }
}
