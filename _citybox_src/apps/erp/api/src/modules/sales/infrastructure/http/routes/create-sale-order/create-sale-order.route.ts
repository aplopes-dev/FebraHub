import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSaleOrderUseCase } from '../../../../application/use-cases/create-sale-order/create-sale-order.use-case';
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
export class CreateSaleOrderRoute {
  constructor(private readonly createSaleOrder: CreateSaleOrderUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Registrar pedido de venda',
    description:
      'Se `status=closed` e o pedido tiver depósito, gera automaticamente 1 movimento de saída no estoque para as linhas de produtos com controle de estoque.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: SaleOrderWritableHttpDto,
  ) {
    const saleOrder = await this.createSaleOrder.execute({
      organizationId,
      createdByUserId: actor.userId,
      createdByName: actor.name ?? 'Usuário',
      ...toSaleOrderWritableInput(dto),
    });

    return SaleOrderPresenter.toHttpSingle(saleOrder);
  }
}
