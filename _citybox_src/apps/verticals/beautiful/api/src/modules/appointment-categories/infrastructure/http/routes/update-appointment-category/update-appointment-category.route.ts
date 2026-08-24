import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateAppointmentCategoryUseCase } from '../../../../application/use-cases/update-appointment-category/update-appointment-category.use-case';
import {
  AppointmentCategoryPresenter,
  AppointmentCategoryResponse,
} from '../../shared/appointment-category.presenter';
import { UpdateAppointmentCategoryHTTPDTO } from './update-appointment-category.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointment Categories')
@Controller('v1/appointment-categories')
export class UpdateAppointmentCategoryRoute {
  constructor(private readonly useCase: UpdateAppointmentCategoryUseCase) {}

  @RequirePermission('update', 'Category')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza categoria de agendamento' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome duplicado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentCategoryHTTPDTO,
  ): Promise<AppointmentCategoryResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
      name: dto.name,
      color: dto.color,
    });
    return AppointmentCategoryPresenter.toHTTP(result);
  }
}
