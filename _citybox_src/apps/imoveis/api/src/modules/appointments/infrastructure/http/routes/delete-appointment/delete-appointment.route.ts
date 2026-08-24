import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeleteAppointmentUseCase } from '../../../../application/use-cases/delete-appointment/delete-appointment.use-case';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('v1/appointments')
export class DeleteAppointmentRoute {
  constructor(private readonly deleteAppointment: DeleteAppointmentUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Calendar')
  @ApiOperation({ summary: 'Excluir compromisso' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteAppointment.execute({ storeId, id });
  }
}
