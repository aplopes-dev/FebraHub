import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardRevenueDetailsUseCase } from '../../../../application/use-cases/list-dashboard-revenue-details/list-dashboard-revenue-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardRevenueDetailsQueryDto } from './list-dashboard-revenue-details.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardRevenueDetailsRoute {
  constructor(
    private readonly listDashboardRevenueDetails: ListDashboardRevenueDetailsUseCase,
  ) {}

  @Get('revenue-analysis/details')
  @ApiOperation({
    summary:
      'Detalhar linhas da análise de receitas por dimensão (paginação e busca server-side)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardRevenueDetailsQueryDto,
  ) {
    const result = await this.listDashboardRevenueDetails.execute({
      storeId,
      ...query,
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
