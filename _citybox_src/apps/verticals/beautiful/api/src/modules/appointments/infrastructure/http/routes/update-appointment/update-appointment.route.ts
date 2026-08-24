import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateAppointmentUseCase } from '../../../../application/use-cases/update-appointment/update-appointment.use-case';
import {
  AppointmentPresenter,
  AppointmentResponse,
} from '../../shared/appointment.presenter';
import { UpdateAppointmentHTTPDTO } from './update-appointment.dto';
import { RequireAnyPermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointments')
@Controller('v1/appointments')
export class UpdateAppointmentRoute {
  constructor(private readonly useCase: UpdateAppointmentUseCase) {}

  @RequireAnyPermission(
    { action: 'update', subject: 'Schedule' },
    { action: 'create', subject: 'Schedule' },
  )
  @Patch(':id')
  @ApiOperation({
    summary: 'Edita / remarca agendamento (horário, serviços, observações)',
  })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Horário ocupado' })
  @ApiResponse({ status: 422, description: 'Fora da grade ou dados inválidos' })
  async handle(
    @StoreId() storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentHTTPDTO,
  ): Promise<AppointmentResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
      clientNotes: dto.clientNotes,
      categoryId: dto.categoryId,
      date: dto.date,
      startTime: dto.startTime,
      services: dto.services,
    });

    return AppointmentPresenter.toHTTP(result);
  }
}
