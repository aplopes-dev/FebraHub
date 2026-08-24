import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinalizeProductionOrderUseCase } from '../../../../application/use-cases/finalize-production-order/finalize-production-order.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { FinalizeProductionOrderHttpDto } from '../shared/production-order.dto';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';
import { resolveActorName } from '../shared/resolve-actor-name';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class FinalizeProductionOrderRoute {
  constructor(
    private readonly finalizeProductionOrder: FinalizeProductionOrderUseCase,
  ) {}

  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Finalizar produção',
    description:
      'Gera os movimentos do ledger (saída dos insumos + entrada do produto acabado) e marca a ordem como `completed`. Idempotente.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinalizeProductionOrderHttpDto,
  ) {
    const order = await this.finalizeProductionOrder.execute({
      organizationId,
      id,
      producedQuantity: dto.producedQuantity,
      observation: dto.observation,
      createdByUserId: actor.userId,
      userName: resolveActorName(actor),
    });

    return ProductionOrderPresenter.toHttpSingle(order);
  }
}
