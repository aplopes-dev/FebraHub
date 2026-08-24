import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StartProductionOrderUseCase } from '../../../../application/use-cases/start-production-order/start-production-order.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';
import { resolveActorName } from '../shared/resolve-actor-name';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class StartProductionOrderRoute {
  constructor(
    private readonly startProductionOrder: StartProductionOrderUseCase,
  ) {}

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('store.stock.manage')
  @ApiOperation({ summary: 'Iniciar produção (pending → in_progress)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.startProductionOrder.execute({
      organizationId,
      id,
      userName: resolveActorName(actor),
    });

    return ProductionOrderPresenter.toHttpSingle(order);
  }
}
