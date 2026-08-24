import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSaleOrderUseCase } from '../../../../application/use-cases/update-sale-order/update-sale-order.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';
import {
  SaleOrderWritableHttpDto,
  toSaleOrderWritableInput,
} from '../shared/sale-order.dto';
import { SaleOrderPresenter } from '../shared/sale-order.presenter';

@ApiTags('sales')
@Controller('v1/sale-orders')
export class UpdateSaleOrderRoute {
  constructor(private readonly updateSaleOrder: UpdateSaleOrderUseCase) {}

  @Put(':id')
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Atualizar pedido de venda',
    description:
      'Semântica de PUT: substitui todas as linhas e pagamentos. Bloqueado (409) se o pedido já tiver gerado saída no estoque.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido, cliente, estoque ou produto não encontrado',
  })
  @ApiResponse({ status: 409, description: 'Pedido já baixou estoque' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaleOrderWritableHttpDto,
  ) {
    const saleOrder = await this.updateSaleOrder.execute({
      organizationId,
      id,
      createdByUserId: actor.userId,
      ...toSaleOrderWritableInput(dto),
      status: dto.status ?? 'open',
    });

    return SaleOrderPresenter.toHttpSingle(saleOrder);
  }
}
