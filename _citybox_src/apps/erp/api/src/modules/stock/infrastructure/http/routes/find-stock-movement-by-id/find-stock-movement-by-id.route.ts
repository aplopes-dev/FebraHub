import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindStockMovementByIdUseCase } from '../../../../application/use-cases/find-stock-movement-by-id/find-stock-movement-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { StockMovementPresenter } from '../shared/stock-movement.presenter';

@ApiTags('stock-movements')
@Controller('v1/stock-movements')
export class FindStockMovementByIdRoute {
  constructor(
    private readonly findStockMovementById: FindStockMovementByIdUseCase,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhe da movimentação' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const detail = await this.findStockMovementById.execute({
      organizationId,
      id,
    });
    return StockMovementPresenter.toHttpDetail(detail);
  }
}
