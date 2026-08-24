import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCommissionRulesUseCase } from '../../../application/use-cases/get-commission-rules/get-commission-rules.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CommissionRulePresenter } from './commission-rule.presenter';

@ApiTags('commission-rules')
@Controller('v1/team/:memberId/commission-rules')
@RequirePermission('read', 'Team')
export class GetCommissionRulesRoute {
  constructor(private readonly getCommissionRules: GetCommissionRulesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar regras de comissão do profissional' })
  async handle(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
  ) {
    const rules = await this.getCommissionRules.execute({ storeId, memberId });
    return CommissionRulePresenter.toHttp(rules);
  }
}
