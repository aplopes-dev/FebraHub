import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListUnitsOfMeasureUseCase } from '../../../../application/use-cases/list-units-of-measure/list-units-of-measure.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UnitOfMeasurePresenter } from '../shared/catalog-support.presenter';
import {
  isPaginatedRequest,
  parseActiveOnly,
  parseListPage,
  parseListPerPage,
  parseSearch,
} from '../list-product-categories/list-product-categories.query';

@ApiTags('units-of-measure')
@Controller('v1/units-of-measure')
@RequirePermission('store.catalog.manage')
export class ListUnitsOfMeasureRoute {
  constructor(private readonly listUnits: ListUnitsOfMeasureUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar unidades de medida' })
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
    const result = await this.listUnits.execute({
      organizationId,
      activeOnly: parseActiveOnly(active),
      search: parseSearch(search),
      ...(paginated
        ? { page: parseListPage(page), perPage: parseListPerPage(perPage) }
        : {}),
    });

    if (Array.isArray(result)) {
      return UnitOfMeasurePresenter.toHttpSimpleList(result);
    }

    return UnitOfMeasurePresenter.toHttpPaginatedList(result);
  }
}
