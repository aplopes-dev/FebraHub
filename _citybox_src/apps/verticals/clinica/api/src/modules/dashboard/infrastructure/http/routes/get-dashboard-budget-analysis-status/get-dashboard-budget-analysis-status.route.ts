import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardBudgetAnalysisStatusUseCase } from '../../../../application/use-cases/get-dashboard-budget-analysis-status/get-dashboard-budget-analysis-status.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardBudgetAnalysisStatusQueryDto } from './get-dashboard-budget-analysis-status.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardBudgetAnalysisStatusRoute {
  constructor(
    private readonly getDashboardBudgetAnalysisStatus: GetDashboardBudgetAnalysisStatusUseCase,
  ) {}

  @Get('budget-analysis/status')
  @ApiOperation({
    summary:
      'Status do Orçamento: summary + timeline + profissionais/anos para selects',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardBudgetAnalysisStatusQueryDto,
  ) {
    const result = await this.getDashboardBudgetAnalysisStatus.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      professionalId: query.professionalId,
    });

    return { data: result };
  }
}
