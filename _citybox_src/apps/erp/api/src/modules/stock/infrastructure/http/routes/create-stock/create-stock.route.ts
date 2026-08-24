import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateStockUseCase } from '../../../../application/use-cases/create-stock/create-stock.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateStockHttpDto } from '../shared/stock.dto';
import { StockPresenter } from '../shared/stock.presenter';

@ApiTags('stocks')
@Controller('v1/stocks')
export class CreateStockRoute {
  constructor(private readonly createStock: CreateStockUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Cadastrar depósito' })
  @ApiResponse({ status: 201, description: 'Depósito criado' })
  @ApiResponse({ status: 404, description: 'Unidade informada não existe' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateStockHttpDto,
  ) {
    const stock = await this.createStock.execute({
      organizationId,
      name: dto.name,
      location: dto.location,
      property: dto.property,
      branchIds: dto.branchIds,
    });

    return StockPresenter.toHttpSingle(stock);
  }
}
