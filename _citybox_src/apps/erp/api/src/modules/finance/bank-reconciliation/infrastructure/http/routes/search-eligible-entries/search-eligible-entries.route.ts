import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchEligibleEntriesUseCase } from '../../../../application/use-cases/search-eligible-entries/search-eligible-entries.use-case';
import { resolvePagination } from '../../../../../../tenancy/application/pagination';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SearchEligibleEntriesQueryDto } from '../shared/bank-statement.dto';
import { EligibleEntryPresenter } from '../shared/eligible-entry.presenter';

/**
 * FR-016/036/037/038, research.md D17 — busca manual/soma unificada (US3/US4),
 * substitui a chamada direta do cliente a `GET /v1/financial-entries`.
 */
@ApiTags('bank-statements')
@Controller(
  'v1/bank-statements/:id/transactions/:transactionId/eligible-entries',
)
export class SearchEligibleEntriesRoute {
  constructor(
    private readonly searchEligibleEntries: SearchEligibleEntriesUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary:
      'Buscar lançamentos elegíveis para conciliar com esta transação (busca manual/soma)',
  })
  @ApiResponse({
    status: 404,
    description: 'Extrato bancário ou transação não encontrados',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Query() query: SearchEligibleEntriesQueryDto,
  ) {
    const result = await this.searchEligibleEntries.execute({
      organizationId,
      bankStatementId,
      transactionId,
      search: query.search?.trim() || undefined,
      periodFrom: query.periodFrom ? new Date(query.periodFrom) : undefined,
      periodTo: query.periodTo ? new Date(query.periodTo) : undefined,
      periodType: query.periodType,
      chartOfAccountId: query.chartOfAccountId,
      customerId: query.customerId,
      supplierId: query.supplierId,
      paymentMethod: query.paymentMethod,
      cardBrand: query.cardBrand,
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
    });
    const pagination = resolvePagination(
      result.total,
      query.page,
      query.perPage,
    );
    return EligibleEntryPresenter.toHttpList(result, pagination);
  }
}
