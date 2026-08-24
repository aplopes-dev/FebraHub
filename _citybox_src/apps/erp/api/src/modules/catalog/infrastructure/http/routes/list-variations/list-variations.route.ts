import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListVariationsUseCase } from '../../../../application/use-cases/list-variations/list-variations.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { VariationPresenter } from '../shared/variation.presenter';
import {
  isPaginatedRequest,
  parseListPage,
  parseListPerPage,
  parseSearch,
} from '../list-product-categories/list-product-categories.query';

@ApiTags('variations')
@Controller('v1/variations')
@RequirePermission('store.catalog.manage')
export class ListVariationsRoute {
  constructor(private readonly listVariations: ListVariationsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar variações do catálogo' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Com page/perPage devolve listagem paginada',
  })
  @ApiQuery({ name: 'perPage', required: false })
  async handle(
    @OrganizationId() organizationId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const paginated = isPaginatedRequest(page, perPage);
    const result = await this.listVariations.execute({
      organizationId,
      search: parseSearch(search),
      ...(paginated
        ? { page: parseListPage(page), perPage: parseListPerPage(perPage) }
        : {}),
    });

    if (Array.isArray(result)) {
      return VariationPresenter.toHttpSimpleList(result);
    }

    return VariationPresenter.toHttpPaginatedList(result);
  }
}
