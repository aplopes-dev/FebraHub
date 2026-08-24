import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSaleOrderStatusUseCase } from '../../../../application/use-cases/update-sale-order-status/update-sale-order-status.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import { UpdateSaleOrderStatusHttpDto } from '../shared/sale-order.dto';
import { SaleOrderPresenter } from '../shared/sale-order.presenter';

@ApiTags('sales')
@Controller('v1/sale-orders')
export class UpdateSaleOrderStatusRoute {
  constructor(
    private readonly updateSaleOrderStatus: UpdateSaleOrderStatusUseCase,
  ) {}

  @Patch(':id/status')
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Trocar status do pedido de venda',
    description:
      'Ao fechar (`status=closed`) com depósito informado, gera o movimento de saída (idempotente). Cancelar um pedido que já baixou estoque é bloqueado (409).',
  })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Cancelamento bloqueado após baixa de estoque',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaleOrderStatusHttpDto,
  ) {
    const saleOrder = await this.updateSaleOrderStatus.execute({
      organizationId,
      id,
      status: dto.status,
      createdByUserId: actor.userId,
    });

    return SaleOrderPresenter.toHttpSingle(saleOrder);
  }
}
