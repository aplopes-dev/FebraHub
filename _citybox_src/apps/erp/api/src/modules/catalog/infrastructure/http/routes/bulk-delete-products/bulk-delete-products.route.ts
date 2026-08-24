import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BulkDeleteProductsUseCase } from '../../../../application/use-cases/bulk-delete-products/bulk-delete-products.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BulkDeleteProductsDto } from '../shared/product.dto';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class BulkDeleteProductsRoute {
  constructor(private readonly bulkDelete: BulkDeleteProductsUseCase) {}

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Excluir produtos em lote (soft-delete)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: BulkDeleteProductsDto,
  ) {
    const result = await this.bulkDelete.execute({
      organizationId,
      ids: dto.ids,
    });
    return { data: result };
  }
}
