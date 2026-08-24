import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindProductByIdUseCase } from '../../../../application/use-cases/find-product-by-id/find-product-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { PriceListRepository } from '../../../../domain/repositories/price-list.repository.interface';
import { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';
import { ProductPresenter } from '../shared/product.presenter';
import { resolveProductStock } from '../shared/resolve-product-stock';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class FindProductByIdRoute {
  constructor(
    private readonly findProductById: FindProductByIdUseCase,
    private readonly priceListRepository: PriceListRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por id' })
  async handle(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    const product = await this.findProductById.execute({
      organizationId: tenant.organizationId,
      id,
    });
    const [namesMap, stock] = await Promise.all([
      this.priceListRepository.findNamesByProductIds(tenant.organizationId, [
        product.id,
      ]),
      resolveProductStock(
        this.stockMovementRepository,
        tenant.organizationId,
        product.id,
        tenant.branchId,
      ),
    ]);
    return ProductPresenter.toHttp(
      product,
      namesMap.get(product.id) ?? [],
      stock,
    );
  }
}
