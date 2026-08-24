import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListProductStockMovementsUseCase } from '../../../../application/use-cases/list-product-stock-movements/list-product-stock-movements.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { StockMovementPresenter } from '../shared/stock-movement.presenter';

@ApiTags('stocks')
@Controller('v1/stocks')
export class ListProductStockMovementsRoute {
  constructor(
    private readonly listProductStockMovements: ListProductStockMovementsUseCase,
  ) {}

  @Get(':stockId/products/:productId/movements')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Histórico de movimentações do produto no depósito',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const lines = await this.listProductStockMovements.execute({
      organizationId,
      stockId,
      productId,
    });

    return StockMovementPresenter.toHttpProductMovements(lines);
  }
}
