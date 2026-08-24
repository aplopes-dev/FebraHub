import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetBankAccountStatementUseCase } from '../../../../application/use-cases/get-bank-account-statement/get-bank-account-statement.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { GetBankAccountStatementQueryDto } from '../shared/bank-transaction.dto';
import { BankTransactionPresenter } from '../shared/bank-transaction.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class GetBankAccountStatementRoute {
  constructor(
    private readonly getBankAccountStatement: GetBankAccountStatementUseCase,
  ) {}

  @Get(':id/statement')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Extrato da conta bancária (aba Histórico)',
    description:
      'Movimentações mais recentes primeiro, com saldo acumulado (`runningBalanceCents`) correto mesmo entre páginas.',
  })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetBankAccountStatementQueryDto,
  ) {
    const result = await this.getBankAccountStatement.execute({
      organizationId,
      bankAccountId: id,
      page: query.page,
      perPage: query.perPage,
    });
    return BankTransactionPresenter.toHttpStatementList(result);
  }
}
