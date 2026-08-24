import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductAddonUseCase } from '../../../../application/use-cases/create-product-addon/create-product-addon.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveProductAddonDto } from '../shared/product-addon.dto';
import { ProductAddonPresenter } from '../shared/product-addon.presenter';

@ApiTags('product-addons')
@Controller('v1/product-addons')
@RequirePermission('store.catalog.manage')
export class CreateProductAddonRoute {
  constructor(private readonly createAddon: CreateProductAddonUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar adicional do catálogo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: SaveProductAddonDto,
  ) {
    const addon = await this.createAddon.execute({
      organizationId,
      name: dto.name,
      defaultPriceCents: dto.defaultPriceCents,
    });
    return ProductAddonPresenter.toHttpSingle(addon);
  }
}
