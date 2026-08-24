import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListStockMovementsUseCase } from '../../../../application/use-cases/list-stock-movements/list-stock-movements.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListStockMovementsQueryDto } from '../shared/stock-movement.dto';
import { StockMovementPresenter } from '../shared/stock-movement.presenter';

@ApiTags('stock-movements')
@Controller('v1/stock-movements')
export class ListStockMovementsRoute {
  constructor(private readonly listStockMovements: ListStockMovementsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar movimentações' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListStockMovementsQueryDto,
  ) {
    const tab =
      query.tab === 'entrada' || query.tab === 'saida' ? query.tab : 'all';

    const result = await this.listStockMovements.execute({
      organizationId,
      tab,
      search: query.search?.trim() || undefined,
      reason: query.reason,
      page: query.page,
      perPage: query.perPage,
    });

    return StockMovementPresenter.toHttpList(result);
  }
}
