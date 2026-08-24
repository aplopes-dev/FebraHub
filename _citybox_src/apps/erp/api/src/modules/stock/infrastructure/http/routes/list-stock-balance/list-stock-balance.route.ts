import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListStockBalanceUseCase } from '../../../../application/use-cases/list-stock-balance/list-stock-balance.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListStockBalanceQueryDto } from '../shared/stock-movement.dto';
import { StockMovementPresenter } from '../shared/stock-movement.presenter';

@ApiTags('stocks')
@Controller('v1/stocks')
export class ListStockBalanceRoute {
  constructor(private readonly listStockBalance: ListStockBalanceUseCase) {}

  @Get(':id/balance')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Balanço do depósito' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) stockId: string,
    @Query() query: ListStockBalanceQueryDto,
  ) {
    const result = await this.listStockBalance.execute({
      organizationId,
      stockId,
      search: query.search?.trim() || undefined,
      status: query.status,
      page: query.page,
      perPage: query.perPage,
    });

    return StockMovementPresenter.toHttpBalance(result);
  }
}
