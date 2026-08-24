import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductionHistoryUseCase } from '../../../../application/use-cases/list-production-history/list-production-history.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class ListProductionHistoryRoute {
  constructor(
    private readonly listProductionHistory: ListProductionHistoryUseCase,
  ) {}

  @Get(':id/history')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Histórico (timeline) da ordem de produção' })
  @ApiResponse({ status: 404, description: 'Ordem de produção não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    const entries = await this.listProductionHistory.execute({
      organizationId,
      orderId,
    });

    return ProductionOrderPresenter.toHttpHistoryList(entries);
  }
}
