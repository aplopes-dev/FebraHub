import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetDashboardSummaryUseCase } from '../../../../application/use-cases/get-dashboard-summary/get-dashboard-summary.use-case';
import { GetDashboardSummaryQueryDto } from './get-dashboard-summary.query';
import { GetDashboardSummaryPresenter } from './get-dashboard-summary.presenter';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('platform.admin')
export class GetDashboardSummaryRoute {
  constructor(private readonly useCase: GetDashboardSummaryUseCase) {}

  @Get('summary')
  @ApiOperation({ summary: 'Obter resumo de indicadores do painel' })
  async handle(@Query() query: GetDashboardSummaryQueryDto) {
    const result = await this.useCase.execute(query);
    return GetDashboardSummaryPresenter.toHttp(result);
  }
}
