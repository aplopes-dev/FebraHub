import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardAppointmentsDetailsUseCase } from '../../../../application/use-cases/list-dashboard-appointments-details/list-dashboard-appointments-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardAppointmentsDetailsQueryDto } from './list-dashboard-appointments-details.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardAppointmentsDetailsRoute {
  constructor(
    private readonly listDashboardAppointmentsDetails: ListDashboardAppointmentsDetailsUseCase,
  ) {}

  @Get('appointments/details')
  @ApiOperation({
    summary: 'Detalhe paginado de consultas do dashboard por grupo',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardAppointmentsDetailsQueryDto,
  ) {
    const result = await this.listDashboardAppointmentsDetails.execute({
      storeId,
      group: query.group,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      categoryId: query.categoryId,
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
