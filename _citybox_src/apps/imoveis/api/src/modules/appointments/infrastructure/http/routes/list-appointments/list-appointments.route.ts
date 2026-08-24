import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  isStoreWideViewer,
  resolveScopedAgentId,
} from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ListAppointmentsUseCase } from '../../../../application/use-cases/list-appointments/list-appointments.use-case';
import { ListAppointmentsPresenter } from './list-appointments.presenter';
import { parseBooleanParam, parseCsvParam } from './list-appointments.query';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('v1/appointments')
export class ListAppointmentsRoute {
  constructor(private readonly listAppointments: ListAppointmentsUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Calendar')
  @ApiOperation({
    summary: 'Listar compromissos por intervalo; corretor vê só os próprios',
  })
  @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Só admin/dono — filtro opcional',
  })
  @ApiQuery({
    name: 'excludeAgentId',
    required: false,
    description: 'Só admin/dono — exclui um corretor',
  })
  @ApiQuery({ name: 'kind', required: false })
  @ApiQuery({
    name: 'done',
    required: false,
    description: 'true|false — omitido retorna concluídos e pendentes',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('agentId') agentId?: string,
    @Query('excludeAgentId') excludeAgentId?: string,
    @Query('kind') kind?: string | string[],
    @Query('done') done?: string,
  ) {
    const storeWide = isStoreWideViewer(user, scope);
    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });
    /** Corretor não pode usar exclude para ver a agenda de outros. */
    const scopedExclude =
      storeWide && typeof excludeAgentId === 'string'
        ? excludeAgentId.trim() || undefined
        : undefined;

    const result = await this.listAppointments.execute({
      storeId,
      from: typeof from === 'string' ? from : '',
      to: typeof to === 'string' ? to : '',
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      agentId: scopedAgentId,
      excludeAgentId: scopedExclude,
      kind: parseCsvParam(kind),
      done: parseBooleanParam(done),
    });
    return ListAppointmentsPresenter.toHttp(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
