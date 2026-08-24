import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListFiscalParametersUseCase } from '../../../../application/use-cases/list-fiscal-parameters/list-fiscal-parameters.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ProductFiscalPresenter } from '../shared/product-fiscal.presenter';
import {
  parseCategories,
  parseCategory,
  parseFiscalSort,
  parseFiscalStatuses,
  parseFiscalTab,
  parseListPage,
  parseListPerPage,
  parseSearch,
} from './list-fiscal-parameters.query';

@ApiTags('fiscal-parameters')
@Controller('v1/fiscal-parameters')
export class ListFiscalParametersRoute {
  constructor(
    private readonly listFiscalParameters: ListFiscalParametersUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar parâmetros fiscais dos produtos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'tab', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'categories', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'statuses', required: false })
  async handle(
    @OrganizationId() organizationId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('tab') tab?: string,
    @Query('category') category?: string,
    @Query('categories') categories?: string | string[],
    @Query('sort') sort?: string,
    @Query('statuses') statuses?: string | string[],
  ) {
    const result = await this.listFiscalParameters.execute({
      organizationId,
      search: parseSearch(search),
      page: parseListPage(page),
      perPage: parseListPerPage(perPage),
      tab: parseFiscalTab(tab),
      category: parseCategory(category),
      categories: parseCategories(categories),
      sort: parseFiscalSort(sort),
      statuses: parseFiscalStatuses(statuses),
    });
    return ProductFiscalPresenter.toHttpPaginatedList(result);
  }
}
