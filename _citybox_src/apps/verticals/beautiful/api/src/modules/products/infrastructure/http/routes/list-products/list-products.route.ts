import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductsUseCase } from '../../../../application/use-cases/list-products/list-products.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListProductsQueryDTO } from './list-products.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ProductPresenter } from '../../shared/product.presenter';

@ApiTags('Products')
@Controller('v1/products')
export class ListProductsRoute {
  constructor(private readonly useCase: ListProductsUseCase) {}

  @RequirePermission('read', 'Product')
  @Get()
  @ApiOperation({ summary: 'Lista os produtos cadastrados no estoque' })
  @ApiResponse({ status: 200, description: 'Lista de produtos retornada' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListProductsQueryDTO,
  ) {
    const result = await this.useCase.execute({
      storeId,
      search: query.search,
      active: query.active,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: ProductPresenter.toHTTPList(result.items),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      stats: result.stats,
    };
  }
}
