import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStockMovementUseCase } from '../../../../application/use-cases/create-stock-movement/create-stock-movement.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { CreateStockMovementHttpDto } from '../shared/stock-movement.dto';
import { StockMovementPresenter } from '../shared/stock-movement.presenter';

@ApiTags('stock-movements')
@Controller('v1/stock-movements')
export class CreateStockMovementRoute {
  constructor(
    private readonly createStockMovement: CreateStockMovementUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Registrar movimentação (entrada/saída)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: CreateStockMovementHttpDto,
  ) {
    const movement = await this.createStockMovement.execute({
      organizationId,
      stockId: dto.stockId,
      categoryId: dto.categoryId,
      type: dto.type,
      operatedAt: new Date(dto.operatedAt),
      createdByUserId: actor.userId,
      lines: dto.lines,
    });

    return StockMovementPresenter.toHttpCreated(movement);
  }
}
