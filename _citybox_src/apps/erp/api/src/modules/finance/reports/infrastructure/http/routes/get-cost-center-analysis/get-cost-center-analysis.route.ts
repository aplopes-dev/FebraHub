import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCostCenterAnalysisUseCase } from '../../../../application/use-cases/get-cost-center-analysis/get-cost-center-analysis.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { GetCostCenterAnalysisQueryDto } from './get-cost-center-analysis.dto';
import { FinanceReportPresenter } from '../shared/finance-report.presenter';

@ApiTags('reports')
@Controller('v1/reports')
export class GetCostCenterAnalysisRoute {
  constructor(
    private readonly getCostCenterAnalysis: GetCostCenterAnalysisUseCase,
  ) {}

  @Get('cost-centers')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Análise por centro de custo',
    description:
      'Percentual e valor de despesa ou receita do período por centro de custo, ordenado por valor decrescente.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: GetCostCenterAnalysisQueryDto,
  ) {
    const result = await this.getCostCenterAnalysis.execute({
      organizationId,
      from: new Date(query.from),
      to: new Date(query.to),
      type: query.type,
    });
    return FinanceReportPresenter.toCostCenterAnalysisHttp(result);
  }
}
