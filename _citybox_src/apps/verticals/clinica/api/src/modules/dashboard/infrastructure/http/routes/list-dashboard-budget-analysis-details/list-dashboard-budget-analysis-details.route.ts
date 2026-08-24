import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardBudgetAnalysisDetailsUseCase } from '../../../../application/use-cases/list-dashboard-budget-analysis-details/list-dashboard-budget-analysis-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardBudgetAnalysisDetailsQueryDto } from './list-dashboard-budget-analysis-details.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardBudgetAnalysisDetailsRoute {
  constructor(
    private readonly listDashboardBudgetAnalysisDetails: ListDashboardBudgetAnalysisDetailsUseCase,
  ) {}

  @Get('budget-analysis/details')
  @ApiOperation({
    summary:
      'Detalhes de orçamentos do dashboard (Status Ver ou Análise Ver), paginado',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardBudgetAnalysisDetailsQueryDto,
  ) {
    const result = await this.listDashboardBudgetAnalysisDetails.execute({
      storeId,
      status: query.status,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      professionalId: query.professionalId,
      dimension: query.dimension,
      dimensionKey: query.dimensionKey,
      page: query.page,
      perPage: query.perPage,
      search: query.search,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        totalValueCents: result.totalValueCents,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
