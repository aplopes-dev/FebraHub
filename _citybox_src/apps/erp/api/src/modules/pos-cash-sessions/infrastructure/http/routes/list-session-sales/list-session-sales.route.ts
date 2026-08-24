import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSessionSalesUseCase } from '../../../../application/use-cases/list-session-sales/list-session-sales.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListSessionSalesQueryDto } from '../shared/pos-cash-session.dto';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-cash-sessions')
@Controller('v1/pos-cash-sessions')
export class ListSessionSalesRoute {
  constructor(private readonly listSessionSales: ListSessionSalesUseCase) {}

  @Get(':id/sales')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Vendas do turno (paginação server-side)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') sessionId: string,
    @Query() query: ListSessionSalesQueryDto,
  ) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const result = await this.listSessionSales.execute({
      organizationId,
      sessionId,
      page,
      perPage,
    });
    return PosCashSessionPresenter.toHttpSales(result, page, perPage);
  }
}
