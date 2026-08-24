import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListStockMovementsUseCase } from '../../../../application/use-cases/list-stock-movements/list-stock-movements.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Products')
@Controller('v1/products')
export class ListStockMovementsRoute {
  constructor(private readonly useCase: ListStockMovementsUseCase) {}

  @RequirePermission('access', 'Stock')
  @Get(':id/stock-movements')
  @ApiOperation({ summary: 'Lista movimentações recentes do produto' })
  @ApiResponse({ status: 200, description: 'Histórico (máx. 50)' })
  async handle(
    @StoreId() storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const list = await this.useCase.execute({ storeId, productId: id });
    return list.map((item) => ({
      id: item.id,
      productId: item.productId,
      type: item.type,
      quantity: item.quantity,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    }));
  }
}
