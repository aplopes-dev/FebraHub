import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListPriceListsUseCase } from '../../../../application/use-cases/list-price-lists/list-price-lists.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PriceListPresenter } from '../shared/price-list.presenter';
import {
  parseListPage,
  parseListPerPage,
  parseSearch,
} from './list-price-lists.query';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class ListPriceListsRoute {
  constructor(private readonly listPriceLists: ListPriceListsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar listas de preços' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async handle(
    @OrganizationId() organizationId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const result = await this.listPriceLists.execute({
      organizationId,
      search: parseSearch(search),
      page: parseListPage(page),
      perPage: parseListPerPage(perPage),
    });
    return PriceListPresenter.toHttpPaginatedList(result);
  }
}
