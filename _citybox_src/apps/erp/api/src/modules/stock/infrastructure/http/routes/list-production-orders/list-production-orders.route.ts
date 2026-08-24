import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListProductionOrdersUseCase } from '../../../../application/use-cases/list-production-orders/list-production-orders.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListProductionOrdersQueryDto } from '../shared/production-order.dto';
import { ProductionOrderPresenter } from '../shared/production-order.presenter';

@ApiTags('production-orders')
@Controller('v1/production-orders')
export class ListProductionOrdersRoute {
  constructor(
    private readonly listProductionOrders: ListProductionOrdersUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar ordens de produção' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListProductionOrdersQueryDto,
  ) {
    const result = await this.listProductionOrders.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });

    return ProductionOrderPresenter.toHttpList(result);
  }
}
