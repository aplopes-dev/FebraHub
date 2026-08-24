import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardAppointmentsUseCase } from '../../../../application/use-cases/get-dashboard-appointments/get-dashboard-appointments.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardAppointmentsQueryDto } from './get-dashboard-appointments.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardAppointmentsRoute {
  constructor(
    private readonly getDashboardAppointments: GetDashboardAppointmentsUseCase,
  ) {}

  @Get('appointments')
  @ApiOperation({
    summary:
      'Agregar consultas do dashboard (realizadas, faltas/cancelamentos, timeline)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardAppointmentsQueryDto,
  ) {
    const result = await this.getDashboardAppointments.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      categoryId: query.categoryId,
    });

    return { data: result };
  }
}
