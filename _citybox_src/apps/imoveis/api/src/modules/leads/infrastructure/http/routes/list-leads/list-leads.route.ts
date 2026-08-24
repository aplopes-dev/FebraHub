import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { resolveScopedAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ListLeadsUseCase } from '../../../../application/use-cases/list-leads/list-leads.use-case';
import { ListLeadsPresenter } from './list-leads.presenter';
import { parseCsvParam } from './list-leads.query';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class ListLeadsRoute {
  constructor(private readonly listLeads: ListLeadsUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Lead')
  @ApiOperation({
    summary: 'Listar leads (paginado); corretor vê só os próprios',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'leadSource', required: false })
  @ApiQuery({ name: 'purpose', required: false })
  @ApiQuery({ name: 'interestedPropertyType', required: false })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description:
      'Filtro de corretor. Corretor é forçado ao próprio. Admin: omitido = próprio; colega = slug; `all` = loja inteira',
  })
  @ApiQuery({
    name: 'followUpUntil',
    required: false,
    description: 'YYYY-MM-DD — retorno devido até esta data (inclusive)',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('status') status?: string | string[],
    @Query('leadSource') leadSource?: string | string[],
    @Query('purpose') purpose?: string | string[],
    @Query('interestedPropertyType') interestedPropertyType?: string | string[],
    @Query('agentId') agentId?: string,
    @Query('followUpUntil') followUpUntil?: string,
  ) {
    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });
    const result = await this.listLeads.execute({
      storeId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      status: parseCsvParam(status),
      leadSource: parseCsvParam(leadSource),
      purpose: parseCsvParam(purpose),
      interestedPropertyType: parseCsvParam(interestedPropertyType),
      agentId: scopedAgentId,
      followUpUntil:
        typeof followUpUntil === 'string'
          ? followUpUntil.trim() || undefined
          : undefined,
    });
    return ListLeadsPresenter.toHttp(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
