import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateStockUseCase } from '../../../../application/use-cases/update-stock/update-stock.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateStockHttpDto } from '../shared/stock.dto';
import { StockPresenter } from '../shared/stock.presenter';

@ApiTags('stocks')
@Controller('v1/stocks')
export class UpdateStockRoute {
  constructor(private readonly updateStock: UpdateStockUseCase) {}

  @Patch(':id')
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Atualizar depósito' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockHttpDto,
  ) {
    const stock = await this.updateStock.execute({
      organizationId,
      id,
      name: dto.name,
      location: dto.location,
      property: dto.property,
      branchIds: dto.branchIds,
    });

    return StockPresenter.toHttpSingle(stock);
  }
}
