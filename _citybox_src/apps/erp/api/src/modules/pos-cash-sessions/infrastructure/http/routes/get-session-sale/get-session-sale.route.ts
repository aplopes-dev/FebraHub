import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSessionSaleUseCase } from '../../../../application/use-cases/get-session-sale/get-session-sale.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-cash-sessions')
@Controller('v1/pos-cash-sessions')
export class GetSessionSaleRoute {
  constructor(private readonly getSessionSale: GetSessionSaleUseCase) {}

  @Get(':id/sales/:saleOrderId')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhe de uma venda do turno' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') sessionId: string,
    @Param('saleOrderId') saleOrderId: string,
  ) {
    const sale = await this.getSessionSale.execute({
      organizationId,
      sessionId,
      saleOrderId,
    });
    return { data: PosCashSessionPresenter.toHttpSale(sale) };
  }
}
