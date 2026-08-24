import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteSaleOrderUseCase } from '../../../../application/use-cases/delete-sale-order/delete-sale-order.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('sales')
@Controller('v1/sale-orders')
export class DeleteSaleOrderRoute {
  constructor(private readonly deleteSaleOrder: DeleteSaleOrderUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('store.sales.manage')
  @ApiOperation({
    summary: 'Excluir pedido de venda',
    description:
      'Soft-delete: sai da aba de ativos. Não estorna o movimento de saída já gerado. Restauração via POST :id/restore.',
  })
  @ApiResponse({ status: 204, description: 'Pedido excluído' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteSaleOrder.execute({ organizationId, id });
  }
}
