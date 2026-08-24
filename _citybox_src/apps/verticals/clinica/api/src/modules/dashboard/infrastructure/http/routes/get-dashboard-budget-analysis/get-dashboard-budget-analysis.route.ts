import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardBudgetAnalysisUseCase } from '../../../../application/use-cases/get-dashboard-budget-analysis/get-dashboard-budget-analysis.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardBudgetAnalysisQueryDto } from './get-dashboard-budget-analysis.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardBudgetAnalysisRoute {
  constructor(
    private readonly getDashboardBudgetAnalysis: GetDashboardBudgetAnalysisUseCase,
  ) {}

  @Get('budget-analysis')
  @ApiOperation({
    summary: 'Agregar análise de orçamentos por dimensão e status',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardBudgetAnalysisQueryDto,
  ) {
    const result = await this.getDashboardBudgetAnalysis.execute({
      storeId,
      status: query.status,
      dimension: query.dimension,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      professionalId: query.professionalId,
    });

    return { data: result.items };
  }
}
