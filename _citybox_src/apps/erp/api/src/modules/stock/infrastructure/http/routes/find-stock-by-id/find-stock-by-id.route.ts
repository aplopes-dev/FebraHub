import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindStockByIdUseCase } from '../../../../application/use-cases/find-stock-by-id/find-stock-by-id.use-case';
import { StockMovementRepository } from '../../../../domain/repositories/stock-movement.repository.interface';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { StockPresenter } from '../shared/stock.presenter';

@ApiTags('stocks')
@Controller('v1/stocks')
export class FindStockByIdRoute {
  constructor(
    private readonly findStockById: FindStockByIdUseCase,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhe do depósito' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const stock = await this.findStockById.execute({ organizationId, id });
    const hasMovements =
      await this.stockMovementRepository.hasMovementsOrBalance(
        organizationId,
        id,
      );
    return StockPresenter.toHttpSingle(stock, hasMovements);
  }
}
