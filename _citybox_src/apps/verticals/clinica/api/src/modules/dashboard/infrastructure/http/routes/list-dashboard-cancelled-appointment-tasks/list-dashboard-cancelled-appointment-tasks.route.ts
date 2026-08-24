import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardCancelledAppointmentTasksUseCase } from '../../../../application/use-cases/list-dashboard-cancelled-appointment-tasks/list-dashboard-cancelled-appointment-tasks.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardCancelledAppointmentTasksQueryDto } from './list-dashboard-cancelled-appointment-tasks.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('access', 'Dashboard')
export class ListDashboardCancelledAppointmentTasksRoute {
  constructor(
    private readonly listCancelledAppointmentTasks: ListDashboardCancelledAppointmentTasksUseCase,
  ) {}

  @Get('tasks/cancelled-appointments')
  @ApiOperation({
    summary:
      'Listar consultas canceladas (paciente ou profissional) para Tarefas — período e paginação server-side',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardCancelledAppointmentTasksQueryDto,
  ) {
    const result = await this.listCancelledAppointmentTasks.execute({
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
