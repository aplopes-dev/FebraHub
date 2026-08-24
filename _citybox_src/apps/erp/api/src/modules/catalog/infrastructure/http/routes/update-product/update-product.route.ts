import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateProductUseCase } from '../../../../application/use-cases/update-product/update-product.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';
import { SaveProductDto } from '../shared/product.dto';
import { ProductPresenter } from '../shared/product.presenter';
import { resolveProductStock } from '../shared/resolve-product-stock';
import { toAddonSettingsInput } from '../shared/to-addon-settings-input';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class UpdateProductRoute {
  constructor(
    private readonly updateProduct: UpdateProductUseCase,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  async handle(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: SaveProductDto,
  ) {
    const product = await this.updateProduct.execute({
      id,
      organizationId: tenant.organizationId,
      name: dto.name,
      sku: dto.sku,
      categoryId: dto.categoryId,
      unitOfMeasureId: dto.unitOfMeasureId ?? null,
      type: dto.type,
      basePriceCents: dto.basePriceCents,
      perishable: dto.perishable ?? false,
      description: dto.description ?? '',
      imageUrl: dto.imageUrl ?? null,
      trackStock: dto.trackStock ?? false,
      barcodes: dto.barcodes ?? [],
      availableOnErp: dto.availableOnErp ?? true,
      availableOnPdv: dto.availableOnPdv ?? true,
      branchIds: dto.branchIds ?? [],
      suppliers: (dto.suppliers ?? []).map((link) => ({
        supplierId: link.supplierId,
        supplierCode: link.supplierCode ?? null,
        conversion: link.conversion ?? 1,
      })),
      variationFormat: dto.variationFormat ?? null,
      variations: dto.variations,
      addonSettings: toAddonSettingsInput(dto.addonSettings),
      addonLines: dto.addonLines,
      suggestions: dto.suggestions,
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
