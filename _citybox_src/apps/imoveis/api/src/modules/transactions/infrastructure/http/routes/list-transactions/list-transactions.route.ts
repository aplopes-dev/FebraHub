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
import { ListTransactionsUseCase } from '../../../../application/use-cases/list-transactions/list-transactions.use-case';
import { ListTransactionsPresenter } from './list-transactions.presenter';
import { parseCsvParam } from './list-transactions.query';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class ListTransactionsRoute {
  constructor(private readonly listTransactions: ListTransactionsUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Transaction')
  @ApiOperation({
    summary: 'Listar negócios; corretor só onde é captador/vendedor',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false, description: 'SALE,RENTAL' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'DRAFT,PROPOSAL,CONTRACT_SIGNED,COMPLETED,CANCELLED',
  })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Admin: captador/vendedor; corretor forçado ao próprio',
  })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'YYYY-MM-DD' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('type') type?: string | string[],
    @Query('status') status?: string | string[],
    @Query('agentId') agentId?: string,
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ) {
    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });
    const result = await this.listTransactions.execute({
      storeId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search: typeof search === 'string' ? search : undefined,
      type: parseCsvParam(type),
      status: parseCsvParam(status),
      agentId: scopedAgentId,
      periodFrom: typeof periodFrom === 'string' ? periodFrom : undefined,
      periodTo: typeof periodTo === 'string' ? periodTo : undefined,
    });
    return ListTransactionsPresenter.toHttp(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
