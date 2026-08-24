import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateAppointmentCategoryUseCase } from '../../../../application/use-cases/create-appointment-category/create-appointment-category.use-case';
import {
  AppointmentCategoryPresenter,
  AppointmentCategoryResponse,
} from '../../shared/appointment-category.presenter';
import { CreateAppointmentCategoryHTTPDTO } from './create-appointment-category.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointment Categories')
@Controller('v1/appointment-categories')
export class CreateAppointmentCategoryRoute {
  constructor(private readonly useCase: CreateAppointmentCategoryUseCase) {}

  @RequirePermission('create', 'Category')
  @Post()
  @ApiOperation({ summary: 'Cria categoria de agendamento' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  @ApiResponse({ status: 409, description: 'Nome duplicado' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateAppointmentCategoryHTTPDTO,
  ): Promise<AppointmentCategoryResponse> {
    const result = await this.useCase.execute({
      storeId,
      name: dto.name,
      color: dto.color,
    });
    return AppointmentCategoryPresenter.toHTTP(result);
  }
}
