import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateProductCategoryUseCase } from '../../../../application/use-cases/update-product-category/update-product-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveProductCategoryDto } from '../shared/product-category.dto';
import { ProductCategoryPresenter } from '../shared/catalog-support.presenter';

@ApiTags('product-categories')
@Controller('v1/product-categories')
@RequirePermission('store.catalog.manage')
export class UpdateProductCategoryRoute {
  constructor(private readonly updateCategory: UpdateProductCategoryUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria de produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: SaveProductCategoryDto,
  ) {
    const category = await this.updateCategory.execute({
      organizationId,
      id,
      name: dto.name,
      active: dto.active ?? true,
    });
    return ProductCategoryPresenter.toHttpSingle(category);
  }
}
