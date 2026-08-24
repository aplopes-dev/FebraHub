import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteProductUseCase } from '../../../../application/use-cases/delete-product/delete-product.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class DeleteProductRoute {
  constructor(private readonly deleteProduct: DeleteProductUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir produto (soft-delete)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteProduct.execute({ organizationId, id });
  }
}
