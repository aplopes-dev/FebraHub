import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DuplicateProductUseCase } from '../../../../application/use-cases/duplicate-product/duplicate-product.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';
import { ProductPresenter } from '../shared/product.presenter';
import { resolveProductStock } from '../shared/resolve-product-stock';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class DuplicateProductRoute {
  constructor(
    private readonly duplicateProduct: DuplicateProductUseCase,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar produto' })
  async handle(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    const product = await this.duplicateProduct.execute({
      organizationId: tenant.organizationId,
      productId: id,
    });
    const stock = await resolveProductStock(
      this.stockMovementRepository,
      tenant.organizationId,
      product.id,
      tenant.branchId,
    );
    return ProductPresenter.toHttp(product, [], stock);
  }
}
