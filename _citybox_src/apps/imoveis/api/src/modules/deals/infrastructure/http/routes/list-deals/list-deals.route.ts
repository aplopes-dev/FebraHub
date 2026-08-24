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
import { ListDealsUseCase } from '../../../../application/use-cases/list-deals/list-deals.use-case';
import { TransactionRepository } from '../../../../../transactions/domain/repositories/transaction.repository.interface';
import { ListDealsPresenter } from './list-deals.presenter';
import { parseCsvParam } from './list-deals.query';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('v1/deals')
export class ListDealsRoute {
  constructor(
    private readonly listDeals: ListDealsUseCase,
    private readonly transactions: TransactionRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Lead')
  @ApiOperation({
    summary: 'Listar negócios CRM (funil); corretor vê só os próprios',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'leadId', required: false })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Só admin/dono — filtro opcional',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'active,won,cancelled',
  })
  @ApiQuery({
    name: 'stage',
    required: false,
    description:
      'awaiting_property,property_selected,contract_sent,contract_signed,payment_confirmed,handover',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('leadId') leadId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('agentId') agentId?: string,
    @Query('status') status?: string | string[],
    @Query('stage') stage?: string | string[],
  ) {
    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });
    const result = await this.listDeals.execute({
      storeId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search: typeof search === 'string' ? search : undefined,
      leadId: typeof leadId === 'string' ? leadId : undefined,
      propertyId: typeof propertyId === 'string' ? propertyId : undefined,
      agentId: scopedAgentId,
      status: parseCsvParam(status),
      stage: parseCsvParam(stage),
    });
    const transactionIds = await this.transactions.findTransactionIdsByDealIds(
      storeId,
      result.items.map((deal) => deal.id),
    );
    const missingLeadIds = result.items
      .filter((deal) => !transactionIds.has(deal.id))
      .map((deal) => deal.leadId);
    if (missingLeadIds.length > 0) {
      const byLead = await this.transactions.findTransactionIdsByLeadIds(
        storeId,
        missingLeadIds,
      );
      for (const deal of result.items) {
        if (transactionIds.has(deal.id)) continue;
        const txId = byLead.get(deal.leadId);
        if (txId) transactionIds.set(deal.id, txId);
      }
    }
    return ListDealsPresenter.toHttp(
      result.items,
      {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      transactionIds,
    );
  }
}
