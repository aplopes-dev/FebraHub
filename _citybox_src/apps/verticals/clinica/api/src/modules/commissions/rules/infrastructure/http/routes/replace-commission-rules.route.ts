import { Body, Controller, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReplaceCommissionRulesUseCase } from '../../../application/use-cases/replace-commission-rules/replace-commission-rules.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ReplaceCommissionRulesBodyDto } from './commission-rule-body.dto';
import { CommissionRulePresenter } from './commission-rule.presenter';

@ApiTags('commission-rules')
@Controller('v1/team/:memberId/commission-rules')
@RequirePermission('update', 'Team')
export class ReplaceCommissionRulesRoute {
  constructor(
    private readonly replaceCommissionRules: ReplaceCommissionRulesUseCase,
  ) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Substituir regras de comissão do profissional' })
  async handle(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ReplaceCommissionRulesBodyDto,
  ) {
    const rules = await this.replaceCommissionRules.execute({
      storeId,
      memberId,
      memberName: dto.memberName,
      rules: dto.rules,
    });
    return CommissionRulePresenter.toHttp(rules);
  }
}
