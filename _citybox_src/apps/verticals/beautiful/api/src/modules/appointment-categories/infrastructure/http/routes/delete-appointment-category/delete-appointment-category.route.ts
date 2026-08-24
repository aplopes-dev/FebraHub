import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { DeleteAppointmentCategoryUseCase } from '../../../../application/use-cases/delete-appointment-category/delete-appointment-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Appointment Categories')
@Controller('v1/appointment-categories')
export class DeleteAppointmentCategoryRoute {
  constructor(private readonly useCase: DeleteAppointmentCategoryUseCase) {}

  @RequirePermission('update', 'Category')
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove categoria de agendamento' })
  @ApiResponse({ status: 204, description: 'Categoria removida' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Categoria em uso' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.useCase.execute({ storeId, id });
  }
}
