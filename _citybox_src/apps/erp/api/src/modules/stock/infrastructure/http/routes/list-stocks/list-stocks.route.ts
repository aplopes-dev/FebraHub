import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListStocksUseCase } from '../../../../application/use-cases/list-stocks/list-stocks.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListStocksQueryDto } from '../shared/stock.dto';
import { StockPresenter } from '../shared/stock.presenter';

@ApiTags('stocks')
@Controller('v1/stocks')
export class ListStocksRoute {
  constructor(private readonly listStocks: ListStocksUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar depósitos',
    description:
      'Depósitos da organização ativa. Busca por nome; paginação server-side.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListStocksQueryDto,
  ) {
    const result = await this.listStocks.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });

    return StockPresenter.toHttpList(result);
  }
}
