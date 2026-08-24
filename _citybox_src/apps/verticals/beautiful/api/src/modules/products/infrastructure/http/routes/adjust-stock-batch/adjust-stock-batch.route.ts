import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdjustStockBatchUseCase } from '../../../../application/use-cases/adjust-stock-batch/adjust-stock-batch.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { AdjustStockBatchHTTPDTO } from './adjust-stock-batch.dto';

@ApiTags('Products')
@Controller('v1/products')
export class AdjustStockBatchRoute {
  constructor(private readonly useCase: AdjustStockBatchUseCase) {}

  @RequirePermission('update', 'Stock')
  @Post('stock-movements/batch')
  @ApiOperation({ summary: 'Registra movimentações de estoque em lote em uma única requisição' })
  @ApiResponse({ status: 200, description: 'Movimentações em lote processadas com sucesso' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: AdjustStockBatchHTTPDTO,
  ) {
    const result = await this.useCase.execute({
      storeId,
      items: dto.items,
    });

    return result;
  }
}
