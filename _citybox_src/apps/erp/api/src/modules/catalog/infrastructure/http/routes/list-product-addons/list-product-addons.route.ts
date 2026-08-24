import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListProductAddonsUseCase } from '../../../../application/use-cases/list-product-addons/list-product-addons.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ProductAddonPresenter } from '../shared/product-addon.presenter';
import {
  isPaginatedRequest,
  parseActiveOnly,
  parseListPage,
  parseListPerPage,
  parseSearch,
} from '../list-product-categories/list-product-categories.query';

@ApiTags('product-addons')
@Controller('v1/product-addons')
@RequirePermission('store.catalog.manage')
export class ListProductAddonsRoute {
  constructor(private readonly listAddons: ListProductAddonsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar adicionais do catálogo' })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'default true — só ativos; false traz também os excluídos',
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
    const result = await this.listAddons.execute({
      organizationId,
      active: parseActiveOnly(active),
      search: parseSearch(search),
      ...(paginated
        ? { page: parseListPage(page), perPage: parseListPerPage(perPage) }
        : {}),
    });

    if (Array.isArray(result)) {
      return ProductAddonPresenter.toHttpSimpleList(result);
    }

    return ProductAddonPresenter.toHttpPaginatedList(result);
  }
}
