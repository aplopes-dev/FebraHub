import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteCustomerCategoryUseCase } from '../../../../application/use-cases/delete-customer-category/delete-customer-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('customer-categories')
@Controller('v1/customer-categories')
export class DeleteCustomerCategoryRoute {
  constructor(private readonly deleteCategory: DeleteCustomerCategoryUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('org.customers.manage')
  @ApiOperation({ summary: 'Excluir categoria de cliente' })
  @ApiResponse({ status: 204, description: 'Categoria excluída' })
  @ApiResponse({
    status: 409,
    description: 'Categoria possui clientes vinculados',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteCategory.execute({ organizationId, id });
  }
}
