import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListBankAccountTransactionsUseCase } from '../../../../application/use-cases/list-bank-account-transactions/list-bank-account-transactions.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListBankAccountTransactionsQueryDto } from '../shared/bank-transaction.dto';
import { BankTransactionPresenter } from '../shared/bank-transaction.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class ListBankAccountTransactionsRoute {
  constructor(
    private readonly listBankAccountTransactions: ListBankAccountTransactionsUseCase,
  ) {}

  @Get(':id/transactions')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Transações da conta bancária (aba Transações)',
    description: 'Analítica, paginada, filtrável por tipo e período.',
  })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListBankAccountTransactionsQueryDto,
  ) {
    const result = await this.listBankAccountTransactions.execute({
      organizationId,
      bankAccountId: id,
      kind: query.kind,
      effectiveFrom: query.effectiveFrom
        ? new Date(query.effectiveFrom)
        : undefined,
      effectiveTo: query.effectiveTo ? new Date(query.effectiveTo) : undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return BankTransactionPresenter.toHttpTransactionList(result);
  }
}
