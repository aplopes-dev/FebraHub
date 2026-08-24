import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSaleOrdersUseCase } from '../../../../application/use-cases/list-sale-orders/list-sale-orders.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListSaleOrdersQueryDto } from '../shared/sale-order.dto';
import { SaleOrderPresenter } from '../shared/sale-order.presenter';

@ApiTags('sales')
@Controller('v1/sale-orders')
export class ListSaleOrdersRoute {
  constructor(private readonly listSaleOrders: ListSaleOrdersUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar pedidos de venda' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListSaleOrdersQueryDto,
  ) {
    const result = await this.listSaleOrders.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      statuses: query.statuses,
      channelId: query.channelId,
      amountMinCents: query.amountMinCents,
      amountMaxCents: query.amountMaxCents,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      sort: query.sort,
      page: query.page,
      perPage: query.perPage,
    });

    return SaleOrderPresenter.toHttpList(result);
  }
}
