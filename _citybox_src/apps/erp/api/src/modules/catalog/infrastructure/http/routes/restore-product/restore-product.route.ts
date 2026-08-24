import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestoreProductUseCase } from '../../../../application/use-cases/restore-product/restore-product.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';
import { ProductPresenter } from '../shared/product.presenter';
import { resolveProductStock } from '../shared/resolve-product-stock';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class RestoreProductRoute {
  constructor(
    private readonly restoreProduct: RestoreProductUseCase,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar produto excluído' })
  async handle(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    const product = await this.restoreProduct.execute({
      organizationId: tenant.organizationId,
      id,
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
