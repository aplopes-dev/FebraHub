import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetAppointmentByIdUseCase } from '../../../../application/use-cases/get-appointment-by-id/get-appointment-by-id.use-case';
import { GetAppointmentByIdPresenter } from './get-appointment-by-id.presenter';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('v1/appointments')
export class GetAppointmentByIdRoute {
  constructor(private readonly getAppointmentById: GetAppointmentByIdUseCase) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Calendar')
  @ApiOperation({ summary: 'Obter compromisso por id' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const appointment = await this.getAppointmentById.execute({ storeId, id });
    return GetAppointmentByIdPresenter.toHttp(appointment);
  }
}
