import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CommissionAccrualRepository } from '../../../domain/repositories/commission-accrual.repository.interface';
import { CommissionRuleRepository } from '../../../../rules/domain/repositories/commission-rule.repository.interface';
import { parseMemberId } from '../../../../shared/domain/commission-member.utils';
import {
  buildMemberSummary,
  type CommissionMemberSummaryView,
} from '../../mappers/aggregate-open-commissions';
import type { GetOpenCommissionDetailDto } from '../../dtos/commission-accrual.dto';
import { CommissionMemberOpenNotFoundError } from '../../../domain/errors/commission-member-open-not-found.error';
import { EnrichCommissionTreatmentNamesService } from '../../services/enrich-commission-treatment-names.service';

@Injectable()
export class GetOpenCommissionDetailUseCase
  implements IUseCase<GetOpenCommissionDetailDto, CommissionMemberSummaryView>
{
  constructor(
    private readonly accrualRepository: CommissionAccrualRepository,
    private readonly ruleRepository: CommissionRuleRepository,
    private readonly enrichTreatmentNames: EnrichCommissionTreatmentNamesService,
  ) {}

  async execute(
    dto: GetOpenCommissionDetailDto,
  ): Promise<CommissionMemberSummaryView> {
    const memberId = parseMemberId(dto.memberId);
    const [rawAccruals, hasRules] = await Promise.all([
      this.accrualRepository.findOpenByMember(dto.storeId, memberId, {
        startDate: dto.startDate,
        endDate: dto.endDate,
      }),
      this.ruleRepository.existsByMember(dto.storeId, memberId),
    ]);

    if (rawAccruals.length === 0 && !hasRules) {
      throw new CommissionMemberOpenNotFoundError(
        GetOpenCommissionDetailUseCase.name,
        memberId,
      );
    }

    const accruals = await this.enrichTreatmentNames.execute(
      dto.storeId,
      rawAccruals,
    );

    const memberName =
      accruals[0]?.memberName ??
      (await this.ruleRepository.findByMember(dto.storeId, memberId))[0]
        ?.memberName ??
      '';

    return buildMemberSummary({
      memberId,
      memberName,
      hasCommissionConfigured: hasRules,
      accruals,
    });
  }
}
