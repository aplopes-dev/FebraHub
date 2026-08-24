import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CommissionRule } from '../../../domain/entities/commission-rule.entity';
import { CommissionRuleRepository } from '../../../domain/repositories/commission-rule.repository.interface';
import { parseMemberId } from '../../../domain/validators/commission-rule.validator';
import type { GetCommissionRulesDto } from '../../dtos/commission-rule.dto';

@Injectable()
export class GetCommissionRulesUseCase
  implements IUseCase<GetCommissionRulesDto, CommissionRule[]>
{
  constructor(private readonly ruleRepository: CommissionRuleRepository) {}

  async execute(dto: GetCommissionRulesDto): Promise<CommissionRule[]> {
    const memberId = parseMemberId(dto.memberId);
    return this.ruleRepository.findByMember(dto.storeId, memberId);
  }
}
