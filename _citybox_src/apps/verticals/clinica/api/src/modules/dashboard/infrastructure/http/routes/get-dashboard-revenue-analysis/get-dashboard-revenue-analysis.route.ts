import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardRevenueAnalysisUseCase } from '../../../../application/use-cases/get-dashboard-revenue-analysis/get-dashboard-revenue-analysis.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardRevenueAnalysisQueryDto } from './get-dashboard-revenue-analysis.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardRevenueAnalysisRoute {
  constructor(
    private readonly getDashboardRevenueAnalysis: GetDashboardRevenueAnalysisUseCase,
  ) {}

  @Get('revenue-analysis')
  @ApiOperation({
    summary:
      'Agregar análise de receitas (recebimentos ou vendas) por dimensão e período',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardRevenueAnalysisQueryDto,
  ) {
    const result = await this.getDashboardRevenueAnalysis.execute({
      storeId,
      ...query,
    });

    return { data: result.items };
  }
}
