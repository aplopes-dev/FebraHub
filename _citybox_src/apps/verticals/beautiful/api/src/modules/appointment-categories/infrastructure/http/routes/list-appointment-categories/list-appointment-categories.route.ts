import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListAppointmentCategoriesUseCase } from '../../../../application/use-cases/list-appointment-categories/list-appointment-categories.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  AppointmentCategoryPresenter,
  AppointmentCategoryResponse,
} from '../../shared/appointment-category.presenter';

@ApiTags('Appointment Categories')
@Controller('v1/appointment-categories')
export class ListAppointmentCategoriesRoute {
  constructor(private readonly useCase: ListAppointmentCategoriesUseCase) {}

  @RequirePermission('read', 'Category')
  @Get()
  @ApiOperation({ summary: 'Lista categorias de agendamento' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async handle(
    @StoreId() storeId: string,
  ): Promise<AppointmentCategoryResponse[]> {
    const list = await this.useCase.execute({ storeId });
    return AppointmentCategoryPresenter.toHTTPList(list);
  }
}
