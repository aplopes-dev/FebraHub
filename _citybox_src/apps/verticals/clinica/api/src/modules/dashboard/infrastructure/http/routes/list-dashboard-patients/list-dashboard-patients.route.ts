import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardPatientsByMetricUseCase } from '../../../../application/use-cases/list-dashboard-patients-by-metric/list-dashboard-patients-by-metric.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardPatientsQueryDto } from './list-dashboard-patients.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardPatientsRoute {
  constructor(
    private readonly listDashboardPatientsByMetric: ListDashboardPatientsByMetricUseCase,
  ) {}

  @Get('patients')
  @ApiOperation({
    summary:
      'Listar pacientes do dashboard por métrica (paginação e busca server-side)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardPatientsQueryDto,
  ) {
    const result = await this.listDashboardPatientsByMetric.execute({
      storeId,
      ...query,
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
