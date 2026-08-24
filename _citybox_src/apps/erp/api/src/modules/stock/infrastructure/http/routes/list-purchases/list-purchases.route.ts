import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPurchasesUseCase } from '../../../../application/use-cases/list-purchases/list-purchases.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListPurchasesQueryDto } from '../shared/purchase.dto';
import { PurchasePresenter } from '../shared/purchase.presenter';

@ApiTags('purchases')
@Controller('v1/purchases')
export class ListPurchasesRoute {
  constructor(private readonly listPurchases: ListPurchasesUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar compras' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListPurchasesQueryDto,
  ) {
    const result = await this.listPurchases.execute({
      organizationId,
      tab: query.tab,
      status: query.status,
      search: query.search?.trim() || undefined,
      stockId: query.stockId,
      supplierId: query.supplierId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page: query.page,
      perPage: query.perPage,
    });

    return PurchasePresenter.toHttpList(result);
  }
}
