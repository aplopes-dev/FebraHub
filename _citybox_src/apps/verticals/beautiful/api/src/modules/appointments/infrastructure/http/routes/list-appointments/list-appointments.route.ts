import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListAppointmentsUseCase } from '../../../../application/use-cases/list-appointments/list-appointments.use-case';
import {
  AppointmentPresenter,
  AppointmentResponse,
} from '../../shared/appointment.presenter';
import { ListAppointmentsQueryDTO } from './list-appointments.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointments')
@Controller('v1/appointments')
export class ListAppointmentsRoute {
  constructor(private readonly useCase: ListAppointmentsUseCase) {}

  @RequirePermission('access', 'Schedule')
  @Get()
  @ApiOperation({
    summary: 'Lista agendamentos no período (from/to obrigatórios)',
  })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListAppointmentsQueryDTO,
  ): Promise<AppointmentResponse[]> {
    const list = await this.useCase.execute({
      storeId,
      from: query.from,
      to: query.to,
      professionalId: query.professionalId,
      clientId: query.clientId,
      status: query.status,
    });

    return AppointmentPresenter.toHTTPList(list);
  }
}
