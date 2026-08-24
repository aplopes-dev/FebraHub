import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreSaleOrderUseCase } from '../../../../application/use-cases/restore-sale-order/restore-sale-order.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaleOrderPresenter } from '../shared/sale-order.presenter';

@ApiTags('sales')
@Controller('v1/sale-orders')
export class RestoreSaleOrderRoute {
  constructor(private readonly restoreSaleOrder: RestoreSaleOrderUseCase) {}

  @Post(':id/restore')
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Restaurar pedido de venda excluído',
    description:
      'Limpa deletedAt e devolve o pedido à aba Ativos. Não cria nem estorna movimento de estoque.',
  })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const saleOrder = await this.restoreSaleOrder.execute({
      organizationId,
      id,
    });
    return SaleOrderPresenter.toHttpSingle(saleOrder);
  }
}
