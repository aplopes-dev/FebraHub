import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductionOrderUseCase } from '../../../../application/use-cases/create-production-order/create-production-order.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { CreateProductionOrderHttpDto } from '../shared/production-order.dto';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';
import { resolveActorName } from '../shared/resolve-actor-name';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class CreateProductionOrderRoute {
  constructor(
    private readonly createProductionOrder: CreateProductionOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Criar ordem de produção',
    description:
      'Valida os depósitos e a ficha técnica (BOM) do produto antes de criar a ordem em `pending`.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: CreateProductionOrderHttpDto,
  ) {
    const order = await this.createProductionOrder.execute({
      organizationId,
      productId: dto.productId,
      plannedQuantity: dto.plannedQuantity,
      sourceStockId: dto.sourceStockId,
      destinationStockId: dto.destinationStockId,
      expectedDate: new Date(dto.expectedDate),
      observation: dto.observation,
      createdByUserId: actor.userId,
      userName: resolveActorName(actor),
    });

    return ProductionOrderPresenter.toHttpSingle(order);
  }
}
