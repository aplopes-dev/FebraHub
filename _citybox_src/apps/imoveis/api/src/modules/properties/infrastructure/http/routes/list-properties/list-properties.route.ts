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
import { ListPropertiesUseCase } from '../../../../application/use-cases/list-properties/list-properties.use-case';
import { ListPropertiesPresenter } from './list-properties.presenter';
import { parseCsvParam } from './list-properties.query';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties')
export class ListPropertiesRoute {
  constructor(private readonly listProperties: ListPropertiesUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Property')
  @ApiOperation({
    summary: 'Listar imóveis (paginado); corretor vê só os próprios',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'listingType', required: false })
  @ApiQuery({ name: 'negotiable', required: false })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description:
      'Só admin/dono — filtro opcional; corretor é forçado ao próprio',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('status') status?: string | string[],
    @Query('type') type?: string | string[],
    @Query('listingType') listingType?: string | string[],
    @Query('negotiable') negotiable?: string | string[],
    @Query('agentId') agentId?: string,
  ) {
    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });
    const result = await this.listProperties.execute({
      storeId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      status: parseCsvParam(status),
      type: parseCsvParam(type),
      listingType: parseCsvParam(listingType),
      negotiable: parseCsvParam(negotiable),
      agentId: scopedAgentId,
    });
    return ListPropertiesPresenter.toHttp(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
