import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListStockTransfersUseCase } from '../../../../application/use-cases/list-stock-transfers/list-stock-transfers.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListStockTransfersQueryDto } from '../shared/stock-transfer.dto';
import { StockTransferPresenter } from '../shared/stock-transfer.presenter';

@ApiTags('stock-transfers')
@Controller('v1/stock-transfers')
export class ListStockTransfersRoute {
  constructor(private readonly listStockTransfers: ListStockTransfersUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar transferências' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListStockTransfersQueryDto,
  ) {
    const result = await this.listStockTransfers.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      fromStockId: query.fromStockId,
      toStockId: query.toStockId,
      page: query.page,
      perPage: query.perPage,
    });

    return StockTransferPresenter.toHttpList(result);
  }
}
