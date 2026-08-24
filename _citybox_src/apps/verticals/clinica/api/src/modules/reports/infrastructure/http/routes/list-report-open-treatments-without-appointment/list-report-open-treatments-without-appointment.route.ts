import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportOpenTreatmentsWithoutAppointmentUseCase } from '../../../../application/use-cases/list-report-open-treatments-without-appointment/list-report-open-treatments-without-appointment.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportOpenTreatmentsWithoutAppointmentQueryDto } from './list-report-open-treatments-without-appointment.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportOpenTreatmentsWithoutAppointmentRoute {
  constructor(
    private readonly listReportOpenTreatmentsWithoutAppointment: ListReportOpenTreatmentsWithoutAppointmentUseCase,
  ) {}

  @Get('open-treatments-without-appointment')
  @ApiOperation({
    summary:
      'Relatório: pacientes com procedimentos abertos e sem consulta viva',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportOpenTreatmentsWithoutAppointmentQueryDto,
  ) {
    const result =
      await this.listReportOpenTreatmentsWithoutAppointment.execute({
        storeId,
        page: query.page,
        perPage: query.perPage,
        status: query.status,
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
