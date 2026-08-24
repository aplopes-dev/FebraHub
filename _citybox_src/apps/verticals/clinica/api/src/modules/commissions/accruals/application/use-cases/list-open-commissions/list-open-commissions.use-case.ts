import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CommissionAccrualRepository } from '../../../domain/repositories/commission-accrual.repository.interface';
import { CommissionRuleRepository } from '../../../../rules/domain/repositories/commission-rule.repository.interface';
import { parseMemberId } from '../../../../shared/domain/commission-member.utils';
import {
  buildMemberSummary,
  type CommissionMemberSummaryView,
} from '../../mappers/aggregate-open-commissions';
import { EnrichCommissionTreatmentNamesService } from '../../services/enrich-commission-treatment-names.service';
import type { ListOpenCommissionsDto } from '../../dtos/commission-accrual.dto';

export type ListOpenCommissionsResult = {
  items: CommissionMemberSummaryView[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListOpenCommissionsUseCase
  implements IUseCase<ListOpenCommissionsDto, ListOpenCommissionsResult>
{
  constructor(
    private readonly accrualRepository: CommissionAccrualRepository,
    private readonly ruleRepository: CommissionRuleRepository,
    private readonly enrichTreatmentNames: EnrichCommissionTreatmentNamesService,
  ) {}

  async execute(
    dto: ListOpenCommissionsDto,
  ): Promise<ListOpenCommissionsResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const memberId = dto.memberId
      ? parseMemberId(dto.memberId)
      : undefined;
    const search = dto.search?.trim() || undefined;

    const [rawOpenAccruals, configuredMembers] = await Promise.all([
      this.accrualRepository.findOpenByStore(dto.storeId, {
        startDate: dto.startDate,
        endDate: dto.endDate,
        memberId,
        search,
      }),
      this.ruleRepository.listConfiguredMembers(dto.storeId, search),
    ]);

    const openAccruals = await this.enrichTreatmentNames.execute(
      dto.storeId,
      rawOpenAccruals,
    );

    const configuredIds = new Set(
      configuredMembers.map((member) => member.memberId),
    );

    const memberMap = new Map<
      string,
      { memberName: string; hasRules: boolean }
    >();

    for (const member of configuredMembers) {
      if (memberId && member.memberId !== memberId) continue;
      memberMap.set(member.memberId, {
        memberName: member.memberName,
        hasRules: true,
      });
    }

    for (const accrual of openAccruals) {
      if (memberId && accrual.memberId !== memberId) continue;
      const existing = memberMap.get(accrual.memberId);
      if (existing) {
        if (!existing.memberName) {
          existing.memberName = accrual.memberName;
        }
      } else {
        memberMap.set(accrual.memberId, {
          memberName: accrual.memberName,
          hasRules: configuredIds.has(accrual.memberId),
        });
      }
    }

    const accrualsByMember = new Map<string, typeof openAccruals>();
    for (const accrual of openAccruals) {
      const list = accrualsByMember.get(accrual.memberId) ?? [];
      list.push(accrual);
      accrualsByMember.set(accrual.memberId, list);
    }

    const summaries = [...memberMap.entries()]
      .map(([id, entry]) =>
        buildMemberSummary({
          memberId: id,
          memberName: entry.memberName,
          hasCommissionConfigured: entry.hasRules,
          accruals: accrualsByMember.get(id) ?? [],
        }),
      )
      .sort((a, b) =>
        a.professionalName.localeCompare(b.professionalName, 'pt-BR'),
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
