import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindSaleOrderByIdUseCase } from '../../../../application/use-cases/find-sale-order-by-id/find-sale-order-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaleOrderPresenter } from '../shared/sale-order.presenter';

@ApiTags('sales')
@Controller('v1/sale-orders')
export class FindSaleOrderByIdRoute {
  constructor(private readonly findSaleOrderById: FindSaleOrderByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar pedido de venda',
    description:
      'Devolve o pedido, inclusive excluído — a aba "Excluídos" da listagem leva até ele.',
  })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const detail = await this.findSaleOrderById.execute({
      organizationId,
      id,
    });

    return SaleOrderPresenter.toHttpDetail(detail);
  }
}
