import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListStatementTransactionsUseCase } from '../../../../application/use-cases/list-statement-transactions/list-statement-transactions.use-case';
import { resolvePagination } from '../../../../../../tenancy/application/pagination';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListStatementTransactionsQueryDto } from '../shared/bank-statement.dto';
import { BankStatementTransactionPresenter } from '../shared/bank-statement-transaction.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements/:id/transactions')
export class ListStatementTransactionsRoute {
  constructor(
    private readonly listStatementTransactions: ListStatementTransactionsUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar transações de um extrato, por status' })
  @ApiResponse({ status: 404, description: 'Extrato bancário não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Query() query: ListStatementTransactionsQueryDto,
  ) {
    const result = await this.listStatementTransactions.execute({
      organizationId,
      bankStatementId,
      status: query.status,
      search: query.search?.trim() || undefined,
      postedFrom: query.postedFrom ? new Date(query.postedFrom) : undefined,
      postedTo: query.postedTo ? new Date(query.postedTo) : undefined,
      page: query.page ?? 1,
      perPage: query.perPage ?? 10,
    });
    const pagination = resolvePagination(
      result.total,
      query.page,
      query.perPage,
    );
    return BankStatementTransactionPresenter.toHttpList(result, pagination);
  }
}
