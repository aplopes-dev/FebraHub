import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardInadimplenciaDetailsUseCase } from '../../../../application/use-cases/list-dashboard-inadimplencia-details/list-dashboard-inadimplencia-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardInadimplenciaDetailsQueryDto } from './list-dashboard-inadimplencia-details.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardInadimplenciaDetailsRoute {
  constructor(
    private readonly listDashboardInadimplenciaDetails: ListDashboardInadimplenciaDetailsUseCase,
  ) {}

  @Get('inadimplencia/details')
  @ApiOperation({
    summary: 'Detalhe paginado de débitos inadimplentes do dashboard',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardInadimplenciaDetailsQueryDto,
  ) {
    const result = await this.listDashboardInadimplenciaDetails.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
