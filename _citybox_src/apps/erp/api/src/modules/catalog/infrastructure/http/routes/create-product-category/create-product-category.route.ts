import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductCategoryUseCase } from '../../../../application/use-cases/create-product-category/create-product-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveProductCategoryDto } from '../shared/product-category.dto';
import { ProductCategoryPresenter } from '../shared/catalog-support.presenter';

@ApiTags('product-categories')
@Controller('v1/product-categories')
@RequirePermission('store.catalog.manage')
export class CreateProductCategoryRoute {
  constructor(private readonly createCategory: CreateProductCategoryUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria de produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: SaveProductCategoryDto,
  ) {
    const category = await this.createCategory.execute({
      organizationId,
      name: dto.name,
      active: dto.active,
    });
    return ProductCategoryPresenter.toHttpSingle(category);
  }
}
