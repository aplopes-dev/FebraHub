import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdjustStockUseCase } from '../../../../application/use-cases/adjust-stock/adjust-stock.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ProductPresenter } from '../../shared/product.presenter';
import { AdjustStockHTTPDTO } from './adjust-stock.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Products')
@Controller('v1/products')
export class AdjustStockRoute {
  constructor(private readonly useCase: AdjustStockUseCase) {}

  @RequirePermission('update', 'Stock')
  @Post(':id/stock-movements')
  @ApiOperation({ summary: 'Registra entrada ou saída de estoque' })
  @ApiResponse({ status: 201, description: 'Movimentação registrada' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 422, description: 'Estoque insuficiente' })
  async handle(
    @StoreId() storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockHTTPDTO,
  ) {
    const result = await this.useCase.execute({
      storeId,
      productId: id,
      type: dto.type,
      quantity: dto.quantity,
      note: dto.note,
    });

    return {
      product: ProductPresenter.toHTTP(result.product),
      movement: {
        id: result.movement.id,
        productId: result.movement.productId,
        type: result.movement.type,
        quantity: result.movement.quantity,
        note: result.movement.note,
        createdAt: result.movement.createdAt.toISOString(),
      },
    };
  }
}
