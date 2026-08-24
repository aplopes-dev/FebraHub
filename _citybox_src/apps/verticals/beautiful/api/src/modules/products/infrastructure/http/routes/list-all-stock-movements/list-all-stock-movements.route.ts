import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ListAllStockMovementsUseCase } from '../../../../application/use-cases/list-all-stock-movements/list-all-stock-movements.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import type { StockMovementType } from '../../../../../../../generated/prisma/client';

@ApiTags('Products')
@Controller('v1/products')
export class ListAllStockMovementsRoute {
  constructor(private readonly useCase: ListAllStockMovementsUseCase) {}

  @RequirePermission('access', 'Stock')
  @Get('stock-movements')
  @ApiOperation({ summary: 'Lista todas as movimentações de estoque da loja (paginado e filtrado)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de movimentações' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['IN', 'OUT'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async handle(
    @StoreId() storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: StockMovementType,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.useCase.execute({
      storeId,
      page: page ? Number.parseInt(page, 10) : 1,
      limit: limit ? Number.parseInt(limit, 10) : 20,
      productId: productId || undefined,
      type: type || undefined,
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return {
      items: result.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        unitOfMeasure: item.unitOfMeasure,
        type: item.type,
        quantity: item.quantity,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
      })),
      meta: result.meta,
    };
  }
}
