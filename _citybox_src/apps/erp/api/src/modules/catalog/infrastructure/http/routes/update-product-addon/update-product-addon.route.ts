import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateProductAddonUseCase } from '../../../../application/use-cases/update-product-addon/update-product-addon.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveProductAddonDto } from '../shared/product-addon.dto';
import { ProductAddonPresenter } from '../shared/product-addon.presenter';

@ApiTags('product-addons')
@Controller('v1/product-addons')
@RequirePermission('store.catalog.manage')
export class UpdateProductAddonRoute {
  constructor(private readonly updateAddon: UpdateProductAddonUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar adicional do catálogo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: SaveProductAddonDto,
  ) {
    const addon = await this.updateAddon.execute({
      organizationId,
      id,
      name: dto.name,
      defaultPriceCents: dto.defaultPriceCents,
    });
    return ProductAddonPresenter.toHttpSingle(addon);
  }
}
