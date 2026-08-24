import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteProductCategoryUseCase } from '../../../../application/use-cases/delete-product-category/delete-product-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('product-categories')
@Controller('v1/product-categories')
@RequirePermission('store.catalog.manage')
export class DeleteProductCategoryRoute {
  constructor(private readonly deleteCategory: DeleteProductCategoryUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir categoria de produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteCategory.execute({ organizationId, id });
  }
}
