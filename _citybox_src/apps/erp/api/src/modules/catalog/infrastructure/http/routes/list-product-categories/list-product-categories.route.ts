import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListProductCategoriesUseCase } from '../../../../application/use-cases/list-product-categories/list-product-categories.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ProductCategoryPresenter } from '../shared/catalog-support.presenter';
import {
  isPaginatedRequest,
  parseActiveOnly,
  parseListPage,
  parseListPerPage,
  parseSearch,
} from './list-product-categories.query';

@ApiTags('product-categories')
@Controller('v1/product-categories')
@RequirePermission('store.catalog.manage')
export class ListProductCategoriesRoute {
  constructor(private readonly listCategories: ListProductCategoriesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias de produto' })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'true = só ativas',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Com page/perPage devolve listagem paginada',
  })
  @ApiQuery({ name: 'perPage', required: false })
  async handle(
    @OrganizationId() organizationId: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const paginated = isPaginatedRequest(page, perPage);
    const result = await this.listCategories.execute({
      organizationId,
      activeOnly: parseActiveOnly(active),
      search: parseSearch(search),
      ...(paginated
        ? { page: parseListPage(page), perPage: parseListPerPage(perPage) }
        : {}),
    });

    if (Array.isArray(result)) {
      return ProductCategoryPresenter.toHttpSimpleList(result);
    }

    return ProductCategoryPresenter.toHttpPaginatedList(result);
  }
}
