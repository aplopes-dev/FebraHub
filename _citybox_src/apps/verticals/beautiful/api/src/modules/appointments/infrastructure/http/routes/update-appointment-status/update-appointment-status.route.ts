import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateAppointmentStatusUseCase } from '../../../../application/use-cases/update-appointment-status/update-appointment-status.use-case';
import {
  AppointmentPresenter,
  AppointmentResponse,
} from '../../shared/appointment.presenter';
import { UpdateAppointmentStatusHTTPDTO } from './update-appointment-status.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointments')
@Controller('v1/appointments')
export class UpdateAppointmentStatusRoute {
  constructor(private readonly useCase: UpdateAppointmentStatusUseCase) {}

  @RequirePermission('update', 'Schedule')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualiza o status do agendamento' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusHTTPDTO,
  ): Promise<AppointmentResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
      status: dto.status,
    });

    return AppointmentPresenter.toHTTP(result);
  }
}
