import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCashSessionsUseCase } from '../../../../application/use-cases/list-cash-sessions/list-cash-sessions.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListCashSessionsQueryDto } from '../shared/pos-cash-session.dto';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-cash-sessions')
@Controller('v1/pos-cash-sessions')
export class ListCashSessionsRoute {
  constructor(private readonly listCashSessions: ListCashSessionsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar turnos de caixa (paginação server-side)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListCashSessionsQueryDto,
  ) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const result = await this.listCashSessions.execute({
      organizationId,
      posTerminalId: query.posTerminalId,
      operatorName: query.operatorName,
      openedFrom: query.openedFrom,
      openedTo: query.openedTo,
      page,
      perPage,
    });
    return PosCashSessionPresenter.toHttpListWithMeta(result, page, perPage);
  }
}
