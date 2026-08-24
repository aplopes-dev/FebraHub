import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { GetStockStatsUseCase } from '../../../../application/use-cases/stats/get-stock-stats.use-case';

@ApiTags('stock-stats')
@Controller('v1/stock-stats')
@RequirePermission('manage', 'Stock')
export class StockStatsRoute {
  constructor(private readonly getStats: GetStockStatsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obter estatísticas do estoque' })
  async handle(@StoreId() storeId: string) {
    const stats = await this.getStats.execute({ storeId });
    return { data: stats };
  }
}
