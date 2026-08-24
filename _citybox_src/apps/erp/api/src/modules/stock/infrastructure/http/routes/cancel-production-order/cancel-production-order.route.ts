import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelProductionOrderUseCase } from '../../../../application/use-cases/cancel-production-order/cancel-production-order.use-case';
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
export class CancelProductionOrderRoute {
  constructor(
    private readonly cancelProductionOrder: CancelProductionOrderUseCase,
  ) {}

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Cancelar ordem de produção',
    description:
      'Idempotente: cancelar quem já está cancelada devolve a ordem como está.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.cancelProductionOrder.execute({
      organizationId,
      id,
      userName: resolveActorName(actor),
    });

    return ProductionOrderPresenter.toHttpSingle(order);
  }
}
