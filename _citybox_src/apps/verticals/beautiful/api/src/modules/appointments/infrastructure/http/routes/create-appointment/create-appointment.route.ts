import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateAppointmentUseCase } from '../../../../application/use-cases/create-appointment/create-appointment.use-case';
import {
  AppointmentPresenter,
  AppointmentResponse,
} from '../../shared/appointment.presenter';
import { CreateAppointmentHTTPDTO } from './create-appointment.dto';
import { RequireAnyPermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointments')
@Controller('v1/appointments')
export class CreateAppointmentRoute {
  constructor(private readonly useCase: CreateAppointmentUseCase) {}

  @RequireAnyPermission(
    { action: 'create', subject: 'Schedule' },
    { action: 'update', subject: 'Schedule' },
  )
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Cria um agendamento (clientId ou newClient + services); valida grade e overlap',
  })
  @ApiResponse({ status: 201, description: 'Agendamento criado' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateAppointmentHTTPDTO,
  ): Promise<AppointmentResponse> {
    const result = await this.useCase.execute({
      storeId,
      clientId: dto.clientId,
      newClient: dto.newClient
        ? { name: dto.newClient.name, phone: dto.newClient.phone }
        : undefined,
      clientNotes: dto.clientNotes,
      categoryId: dto.categoryId,
      date: dto.date,
      startTime: dto.startTime,
      status: dto.status,
      services: dto.services.map((s) => ({
        professionalId: s.professionalId,
        serviceId: s.serviceId,
      })),
    });

    return AppointmentPresenter.toHTTP(result);
  }
}
