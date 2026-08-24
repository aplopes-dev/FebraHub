import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListTechnicalSheetsUseCase } from '../../../../application/use-cases/list-technical-sheets/list-technical-sheets.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { TechnicalSheetPresenter } from '../shared/technical-sheet.presenter';
import {
  parseCategories,
  parseCategory,
  parseListPage,
  parseListPerPage,
  parseProductionTypes,
  parseSearch,
  parseTechnicalSheetSort,
  parseTechnicalSheetTab,
} from './list-technical-sheets.query';

@ApiTags('technical-sheets')
@Controller('v1/technical-sheets')
export class ListTechnicalSheetsRoute {
  constructor(
    private readonly listTechnicalSheets: ListTechnicalSheetsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar fichas técnicas dos produtos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'tab', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'categories', required: false })
  @ApiQuery({ name: 'productionTypes', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async handle(
    @OrganizationId() organizationId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('tab') tab?: string,
    @Query('category') category?: string,
    @Query('categories') categories?: string | string[],
    @Query('productionTypes') productionTypes?: string | string[],
    @Query('sort') sort?: string,
  ) {
    const result = await this.listTechnicalSheets.execute({
      organizationId,
      search: parseSearch(search),
      page: parseListPage(page),
      perPage: parseListPerPage(perPage),
      tab: parseTechnicalSheetTab(tab),
      category: parseCategory(category),
      categories: parseCategories(categories),
      productionTypes: parseProductionTypes(productionTypes),
      sort: parseTechnicalSheetSort(sort),
    });
    return TechnicalSheetPresenter.toHttpPaginatedList(result);
  }
}
